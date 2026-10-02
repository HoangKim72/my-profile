"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import JSZip from "jszip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  FolderOpen,
  Loader,
  UploadCloud,
} from "lucide-react";
import { createProject, updateProject } from "@/actions/projects";
import {
  formatFileSize,
  slugifyProjectTitle,
  validateProjectArchiveCandidate,
} from "@/lib/projects/archive";
import { parseResourceTags } from "@/lib/projects/resource";
import type { Project } from "@/types";

type ProjectFormProject = Pick<
  Project,
  | "id"
  | "title"
  | "slug"
  | "githubUrl"
  | "demoUrl"
  | "shortDescription"
  | "content"
  | "subjectName"
  | "semester"
  | "techStack"
  | "status"
>;

type ResourceStatus = "PUBLISHED" | "DRAFT";

interface ResourceFields {
  title: string;
  subjectName: string;
  semester: string;
  shortDescription: string;
  content: string;
  tags: string;
  status: ResourceStatus;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800";

interface ProjectArchiveSummary {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
}

interface ProjectFormProps {
  project?: ProjectFormProject;
  existingArchive?: ProjectArchiveSummary | null;
}

const FOLDER_PICKER_ATTRIBUTES = {
  directory: "",
  multiple: true,
  webkitdirectory: "",
} as InputHTMLAttributes<HTMLInputElement>;

export function ProjectForm({
  project,
  existingArchive = null,
}: ProjectFormProps) {
  const router = useRouter();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<ResourceFields>(() =>
    getInitialFields(project),
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isPreparingArchive, setIsPreparingArchive] = useState(false);

  const totalSelectedBytes = selectedFiles.reduce(
    (total, file) => total + file.size,
    0,
  );
  const isBusy = isSavingProject || isPreparingArchive;

  const updateField = <Key extends keyof ResourceFields>(
    key: Key,
    value: ResourceFields[Key],
  ) => {
    setFields((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const handleFolderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    setSelectedFiles(files);
    setSelectedFolderName(files.length > 0 ? getRootFolderName(files) : null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = fields.title.trim();
    const fieldError = validateFields(fields);

    if (fieldError) {
      setError(fieldError);
      return;
    }

    if (!project && selectedFiles.length === 0) {
      setError("Vui lòng chọn thư mục cần chia sẻ.");
      return;
    }

    setError(null);
    setIsSavingProject(true);

    try {
      const payload = buildProjectPayload(fields, project);
      const result = project
        ? await updateProject(project.id, payload)
        : await createProject(payload);

      if (!result.success || !result.project) {
        throw new Error(result.error || "Không thể lưu project.");
      }

      if (selectedFiles.length > 0) {
        setIsPreparingArchive(true);

        const archive = await createProjectArchive(selectedFiles, trimmedTitle);
        const uploadFormData = new FormData();
        uploadFormData.append(
          "archive",
          archive.archiveFile,
          archive.archiveFile.name,
        );
        uploadFormData.append("folderName", archive.folderName);

        const uploadResponse = await fetch(
          `/api/projects/${result.project.id}/archive`,
          {
            method: "POST",
            body: uploadFormData,
          },
        );

        const uploadResult = await readJsonResponse(uploadResponse);

        if (!uploadResponse.ok) {
          throw new Error(
            uploadResult?.error || "Không thể upload thư mục đã chọn.",
          );
        }
      }

      router.push("/dashboard/projects");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể lưu project lúc này.",
      );
    } finally {
      setIsSavingProject(false);
      setIsPreparingArchive(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-8 p-8">
      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-900 dark:text-red-100">
          {error}
        </div>
      )}

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Thông tin tài liệu</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Môn học, kỳ học và tag dùng để lọc trên trang công khai. Tag cũng
            được trang Skills dùng làm bằng chứng kỹ năng.
          </p>
        </div>

        <Field label="Tên tài liệu *" htmlFor="title">
          <input
            id="title"
            type="text"
            value={fields.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Ví dụ: Bài tập lớn Lập trình Web"
            className={INPUT_CLASS}
            maxLength={200}
            required
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Môn học *" htmlFor="subjectName">
            <input
              id="subjectName"
              type="text"
              value={fields.subjectName}
              onChange={(event) =>
                updateField("subjectName", event.target.value)
              }
              placeholder="Ví dụ: Lập trình Web"
              className={INPUT_CLASS}
              maxLength={120}
              required
            />
          </Field>
          <Field label="Kỳ học *" htmlFor="semester">
            <input
              id="semester"
              type="text"
              value={fields.semester}
              onChange={(event) => updateField("semester", event.target.value)}
              placeholder="Ví dụ: HK1 2025-2026"
              className={INPUT_CLASS}
              maxLength={60}
              required
            />
          </Field>
        </div>

        <Field
          label="Mô tả ngắn *"
          htmlFor="shortDescription"
          hint={`${fields.shortDescription.trim().length}/500 ký tự, tối thiểu 10. Hiện trên thẻ ở danh sách.`}
        >
          <textarea
            id="shortDescription"
            value={fields.shortDescription}
            onChange={(event) =>
              updateField("shortDescription", event.target.value)
            }
            rows={2}
            maxLength={500}
            placeholder="Tài liệu gồm slide, đề cương và bài tập có lời giải."
            className={INPUT_CLASS}
            required
          />
        </Field>

        <Field
          label="Ghi chú chi tiết"
          htmlFor="content"
          hint="Không bắt buộc. Hiện ở trang chi tiết."
        >
          <textarea
            id="content"
            value={fields.content}
            onChange={(event) => updateField("content", event.target.value)}
            rows={5}
            placeholder="Nội dung từng thư mục, cách dùng, nguồn tham khảo..."
            className={INPUT_CLASS}
          />
        </Field>

        <Field
          label="Tag"
          htmlFor="tags"
          hint="Phân tách bằng dấu phẩy, ví dụ: Java, SQL, Đề thi."
        >
          <input
            id="tags"
            type="text"
            value={fields.tags}
            onChange={(event) => updateField("tags", event.target.value)}
            placeholder="Java, Spring Boot, Đề thi"
            className={INPUT_CLASS}
          />
          {parseResourceTags(fields.tags).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {parseResourceTags(fields.tags).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Field>

        <fieldset>
          <legend className="mb-2 block text-sm font-medium">Trạng thái</legend>
          <div className="flex flex-wrap gap-3">
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  fields.status === option.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={fields.status === option.value}
                  onChange={() => updateField("status", option.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="space-y-4 border-t border-gray-200 pt-8 dark:border-gray-800">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
            <FolderOpen size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Shared Folder</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Chọn nguyên folder cần chia sẻ. Nếu không chọn folder mới khi đang
              sửa, hệ thống sẽ giữ nguyên file hiện tại.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-gray-300 p-6 dark:border-gray-700">
          <input
            {...FOLDER_PICKER_ATTRIBUTES}
            ref={folderInputRef}
            type="file"
            className="hidden"
            onChange={handleFolderChange}
          />

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">
                {selectedFolderName || "Chưa chọn thư mục nào"}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file • ${formatFileSize(totalSelectedBytes)} trước khi nén`
                  : "Cấu trúc folder sẽ được giữ nguyên bên trong file ZIP."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <UploadCloud size={18} />
              {selectedFiles.length > 0 ? "Chọn lại thư mục" : "Chọn thư mục"}
            </button>
          </div>
        </div>

        {existingArchive && project && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  File hiện tại
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {existingArchive.fileName} •{" "}
                  {formatFileSize(existingArchive.sizeBytes)}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  Cập nhật:{" "}
                  {new Date(existingArchive.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>

              <Link
                href={`/api/projects/${project.id}/download`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-white dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <Download size={16} />
                Tải file hiện tại
              </Link>
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 dark:border-gray-800 sm:flex-row">
        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy && <Loader size={16} className="animate-spin" />}
          {isPreparingArchive
            ? "Đang nén và upload..."
            : isSavingProject
              ? "Đang lưu tài liệu..."
              : project
                ? "Cập nhật tài liệu"
                : "Tạo tài liệu"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Quay lại
        </button>
      </div>
    </form>
  );
}

const STATUS_OPTIONS: Array<{
  value: ResourceStatus;
  label: string;
  hint: string;
}> = [
  { value: "PUBLISHED", label: "Công khai", hint: "Hiện ngay trên /projects" },
  { value: "DRAFT", label: "Nháp", hint: "Chỉ thấy trong dashboard" },
];

function getInitialFields(project?: ProjectFormProject): ResourceFields {
  return {
    title: project?.title ?? "",
    subjectName: project?.subjectName ?? "",
    semester: project?.semester ?? "",
    shortDescription: project?.shortDescription ?? "",
    content: project?.content ?? "",
    // Drops the placeholder older rows were saved with
    tags: parseResourceTags(project?.techStack).join(", "),
    status: project?.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
  };
}

function validateFields(fields: ResourceFields) {
  if (fields.title.trim().length < 5) {
    return "Tên tài liệu cần ít nhất 5 ký tự.";
  }

  if (!fields.subjectName.trim()) {
    return "Vui lòng nhập môn học.";
  }

  if (!fields.semester.trim()) {
    return "Vui lòng nhập kỳ học.";
  }

  if (fields.shortDescription.trim().length < 10) {
    return "Mô tả ngắn cần ít nhất 10 ký tự.";
  }

  return null;
}

function buildProjectPayload(
  fields: ResourceFields,
  project?: ProjectFormProject,
) {
  const trimmedTitle = fields.title.trim();

  return {
    title: trimmedTitle,
    slug: project?.slug || slugifyProjectTitle(trimmedTitle),
    shortDescription: fields.shortDescription.trim(),
    content: fields.content.trim(),
    subjectName: fields.subjectName.trim(),
    semester: fields.semester.trim(),
    techStack: fields.tags,
    githubUrl: project?.githubUrl || "",
    demoUrl: project?.demoUrl || "",
    visibility: "PUBLIC" as const,
    status: fields.status,
    sharedUsers: [],
  };
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

async function createProjectArchive(files: File[], projectTitle: string) {
  const zip = new JSZip();
  const folderName =
    getRootFolderName(files) || projectTitle.trim() || "shared-folder";

  for (const file of files) {
    const relativePath = file.webkitRelativePath || file.name;
    zip.file(relativePath || file.name, file);
  }

  const archiveBlob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/zip",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
  });

  const archiveFile = new File(
    [archiveBlob],
    `${slugifyProjectTitle(folderName)}.zip`,
    {
      type: "application/zip",
    },
  );

  validateProjectArchiveCandidate(archiveFile);

  return {
    archiveFile,
    folderName,
  };
}

function getRootFolderName(files: File[]) {
  const firstRelativePath = files[0]?.webkitRelativePath ?? "";
  const [rootFolderName] = firstRelativePath.split("/");

  return rootFolderName || null;
}

async function readJsonResponse(response: Response) {
  try {
    return (await response.json()) as { error?: string } | null;
  } catch {
    return null;
  }
}
