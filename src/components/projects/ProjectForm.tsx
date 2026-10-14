"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import JSZip from "jszip";
import { useRouter } from "next/navigation";
import { AlertCircle, Download, FolderOpen, UploadCloud } from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Field,
  Input,
  Textarea,
  cn,
  fieldDescribedBy,
} from "@/components/ui";
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

/** Which input a client-side validation error belongs to. */
type ErrorTarget = keyof ResourceFields | "folder";

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
  const [errorTarget, setErrorTarget] = useState<ErrorTarget | null>(null);
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
    setErrorTarget(null);
  };

  const handleFolderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    setSelectedFiles(files);
    setSelectedFolderName(files.length > 0 ? getRootFolderName(files) : null);
    setError(null);
    setErrorTarget(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = fields.title.trim();
    const fieldError = validateFields(fields);

    if (fieldError) {
      setError(fieldError.message);
      setErrorTarget(fieldError.field);
      return;
    }

    if (!project && selectedFiles.length === 0) {
      setError("Vui lòng chọn thư mục cần chia sẻ.");
      setErrorTarget("folder");
      return;
    }

    setError(null);
    setErrorTarget(null);
    setIsSavingProject(true);

    try {
      const payload = buildProjectPayload(fields, project);
      const result = project
        ? await updateProject(project.id, payload)
        : await createProject(payload);

      if (!result.success || !result.project) {
        throw new Error(result.error || "Không thể lưu tài liệu.");
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
          : "Không thể lưu tài liệu lúc này.",
      );
    } finally {
      setIsSavingProject(false);
      setIsPreparingArchive(false);
    }
  };

  const errorFor = (target: ErrorTarget) =>
    errorTarget === target && error ? error : undefined;
  const formError = error && !errorTarget ? error : null;
  const tagList = parseResourceTags(fields.tags);

  const titleError = errorFor("title");
  const subjectError = errorFor("subjectName");
  const semesterError = errorFor("semester");
  const shortDescriptionError = errorFor("shortDescription");
  const folderError = errorFor("folder");
  const shortDescriptionHint = `${fields.shortDescription.trim().length}/500 ký tự, tối thiểu 10. Hiện trên thẻ ở danh sách.`;
  const contentHint = "Không bắt buộc. Hiện ở trang chi tiết.";
  const tagsHint = "Phân tách bằng dấu phẩy, ví dụ: Java, SQL, Đề thi.";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card as="section" aria-labelledby="resource-info-heading">
        <h2
          id="resource-info-heading"
          className="text-lg font-semibold text-ink"
        >
          Thông tin tài liệu
        </h2>
        <p className="mt-1 text-sm text-muted">
          Môn học, kỳ học và tag dùng để lọc trên trang công khai. Tag cũng được
          trang Kỹ năng dùng làm bằng chứng kỹ năng.
        </p>

        <div className="mt-6 space-y-5">
          <Field
            label="Tên tài liệu"
            htmlFor="title"
            required
            error={titleError}
          >
            <Input
              id="title"
              type="text"
              value={fields.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Ví dụ: Bài tập lớn Lập trình Web"
              maxLength={200}
              required
              invalid={Boolean(titleError)}
              aria-describedby={fieldDescribedBy("title", {
                error: titleError,
              })}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Môn học"
              htmlFor="subjectName"
              required
              error={subjectError}
            >
              <Input
                id="subjectName"
                type="text"
                value={fields.subjectName}
                onChange={(event) =>
                  updateField("subjectName", event.target.value)
                }
                placeholder="Ví dụ: Lập trình Web"
                maxLength={120}
                required
                invalid={Boolean(subjectError)}
                aria-describedby={fieldDescribedBy("subjectName", {
                  error: subjectError,
                })}
              />
            </Field>
            <Field
              label="Kỳ học"
              htmlFor="semester"
              required
              error={semesterError}
            >
              <Input
                id="semester"
                type="text"
                value={fields.semester}
                onChange={(event) =>
                  updateField("semester", event.target.value)
                }
                placeholder="Ví dụ: HK1 2025-2026"
                maxLength={60}
                required
                invalid={Boolean(semesterError)}
                aria-describedby={fieldDescribedBy("semester", {
                  error: semesterError,
                })}
              />
            </Field>
          </div>

          <Field
            label="Mô tả ngắn"
            htmlFor="shortDescription"
            required
            hint={shortDescriptionHint}
            error={shortDescriptionError}
          >
            <Textarea
              id="shortDescription"
              value={fields.shortDescription}
              onChange={(event) =>
                updateField("shortDescription", event.target.value)
              }
              rows={2}
              maxLength={500}
              placeholder="Tài liệu gồm slide, đề cương và bài tập có lời giải."
              required
              invalid={Boolean(shortDescriptionError)}
              aria-describedby={fieldDescribedBy("shortDescription", {
                hint: shortDescriptionHint,
                error: shortDescriptionError,
              })}
            />
          </Field>

          <Field label="Ghi chú chi tiết" htmlFor="content" hint={contentHint}>
            <Textarea
              id="content"
              value={fields.content}
              onChange={(event) => updateField("content", event.target.value)}
              rows={5}
              placeholder="Nội dung từng thư mục, cách dùng, nguồn tham khảo..."
              aria-describedby={fieldDescribedBy("content", {
                hint: contentHint,
              })}
            />
          </Field>

          <Field label="Tag" htmlFor="tags" hint={tagsHint}>
            <Input
              id="tags"
              type="text"
              value={fields.tags}
              onChange={(event) => updateField("tags", event.target.value)}
              placeholder="Java, Spring Boot, Đề thi"
              aria-describedby={fieldDescribedBy("tags", { hint: tagsHint })}
            />
            {tagList.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Tag đã nhập">
                {tagList.map((tag) => (
                  <li key={tag}>
                    <Badge tone="accent">{tag}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">
              Trạng thái
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors duration-150",
                    fields.status === option.value
                      ? "border-accent bg-accent-soft"
                      : "border-line-strong bg-surface hover:bg-sunken",
                  )}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={fields.status === option.value}
                    onChange={() => updateField("status", option.value)}
                    className="mt-1 h-4 w-4 cursor-pointer accent-accent"
                  />
                  <span>
                    <span className="block font-medium text-ink">
                      {option.label}
                    </span>
                    <span className="text-muted">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>

      <Card as="section" aria-labelledby="folder-heading">
        <div className="flex items-start gap-3">
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
            aria-hidden="true"
          >
            <FolderOpen size={20} />
          </span>
          <div className="min-w-0">
            <h2 id="folder-heading" className="text-lg font-semibold text-ink">
              Thư mục chia sẻ
            </h2>
            <p className="mt-1 text-sm text-muted">
              Chọn nguyên thư mục cần chia sẻ. Khi đang sửa, nếu không chọn thư
              mục mới, hệ thống sẽ giữ nguyên file hiện tại.
            </p>
          </div>
        </div>

        <div
          className={cn(
            "mt-5 rounded-lg border border-dashed p-5",
            folderError ? "border-danger" : "border-line-strong",
          )}
        >
          <input
            {...FOLDER_PICKER_ATTRIBUTES}
            ref={folderInputRef}
            type="file"
            className="hidden"
            onChange={handleFolderChange}
          />

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 space-y-1" id="folder-summary">
              <p className="break-words text-base font-semibold text-ink">
                {selectedFolderName || "Chưa chọn thư mục nào"}
              </p>
              <p className="text-sm text-muted">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file · ${formatFileSize(totalSelectedBytes)} trước khi nén`
                  : "Cấu trúc thư mục sẽ được giữ nguyên bên trong file ZIP."}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => folderInputRef.current?.click()}
              leftIcon={<UploadCloud size={18} aria-hidden="true" />}
              aria-describedby={
                folderError ? "folder-summary folder-error" : "folder-summary"
              }
            >
              {selectedFiles.length > 0 ? "Chọn lại thư mục" : "Chọn thư mục"}
            </Button>
          </div>

          {folderError && (
            <p
              id="folder-error"
              role="alert"
              className="mt-3 text-sm font-medium text-danger"
            >
              {folderError}
            </p>
          )}
        </div>

        {existingArchive && project && (
          <Card muted padding="sm" className="mt-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">File hiện tại</p>
                <p className="mt-1 break-words text-sm text-muted">
                  {existingArchive.fileName} ·{" "}
                  {formatFileSize(existingArchive.sizeBytes)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Cập nhật:{" "}
                  {new Date(existingArchive.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>

              <ButtonLink
                href={`/api/projects/${project.id}/download`}
                variant="secondary"
                size="sm"
                leftIcon={<Download size={16} aria-hidden="true" />}
              >
                Tải file hiện tại
              </ButtonLink>
            </div>
          </Card>
        )}
      </Card>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" loading={isBusy}>
          {isPreparingArchive
            ? "Đang nén và tải lên..."
            : isSavingProject
              ? "Đang lưu tài liệu..."
              : project
                ? "Cập nhật tài liệu"
                : "Tạo tài liệu"}
        </Button>

        <Button variant="secondary" onClick={() => router.back()}>
          Quay lại
        </Button>
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
  { value: "DRAFT", label: "Nháp", hint: "Chỉ thấy trong bảng điều khiển" },
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

function validateFields(
  fields: ResourceFields,
): { field: keyof ResourceFields; message: string } | null {
  if (fields.title.trim().length < 5) {
    return { field: "title", message: "Tên tài liệu cần ít nhất 5 ký tự." };
  }

  if (!fields.subjectName.trim()) {
    return { field: "subjectName", message: "Vui lòng nhập môn học." };
  }

  if (!fields.semester.trim()) {
    return { field: "semester", message: "Vui lòng nhập kỳ học." };
  }

  if (fields.shortDescription.trim().length < 10) {
    return {
      field: "shortDescription",
      message: "Mô tả ngắn cần ít nhất 10 ký tự.",
    };
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
