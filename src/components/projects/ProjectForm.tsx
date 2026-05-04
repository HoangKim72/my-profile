"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
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
import type { Project } from "@/types";

type ProjectFormProject = Pick<
  Project,
  "id" | "title" | "slug" | "githubUrl" | "demoUrl"
>;

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
  const [title, setTitle] = useState(project?.title ?? "");
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

  const handleFolderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    setSelectedFiles(files);
    setSelectedFolderName(files.length > 0 ? getRootFolderName(files) : null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Vui lòng nhập tên project trước khi lưu.");
      return;
    }

    if (!project && selectedFiles.length === 0) {
      setError("Vui lòng chọn thư mục cần chia sẻ.");
      return;
    }

    setError(null);
    setIsSavingProject(true);

    try {
      const payload = buildProjectPayload(trimmedTitle, project);
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

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Project Setup</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Đặt tên project và chọn nguyên folder, hệ thống sẽ tự đóng gói
            thành file ZIP để người dùng tải về.
          </p>
        </div>

        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            Project Name *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ví dụ: Tài liệu môn Web nâng cao"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            required
          />
        </div>
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
              ? "Đang lưu project..."
              : project
                ? "Cập nhật project"
                : "Tạo project"}
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

function buildProjectPayload(title: string, project?: ProjectFormProject) {
  const trimmedTitle = title.trim();

  return {
    title: trimmedTitle,
    slug: project?.slug || slugifyProjectTitle(trimmedTitle),
    shortDescription: `Tài liệu cho ${trimmedTitle} đã được đóng gói để tải xuống nhanh và dùng ngay.`,
    content: `Đây là bộ tài liệu dành cho ${trimmedTitle}. Toàn bộ nội dung được đóng gói thành một file ZIP để người dùng có thể tải về chỉ với một lần bấm.`,
    subjectName: trimmedTitle,
    semester: "Tài nguyên chia sẻ",
    techStack: "ZIP archive, Downloadable resources",
    githubUrl: project?.githubUrl || "",
    demoUrl: project?.demoUrl || "",
    visibility: "PUBLIC" as const,
    status: "PUBLISHED" as const,
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
