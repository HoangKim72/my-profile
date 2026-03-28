const DEFAULT_PROJECT_ARCHIVE_MAX_SIZE_BYTES = 50 * 1024 * 1024;

export const PROJECT_ARCHIVE_MAX_SIZE_BYTES = Number.parseInt(
  process.env.NEXT_PUBLIC_PROJECT_ARCHIVE_MAX_SIZE ??
    `${DEFAULT_PROJECT_ARCHIVE_MAX_SIZE_BYTES}`,
  10,
);

export const PROJECT_ARCHIVE_ALLOWED_MIME_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
] as const;

export interface ProjectArchiveCandidate {
  name: string;
  size: number;
  type: string;
}

export function slugifyProjectTitle(text: string) {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "shared-folder";
}

export function sanitizeArchiveFileName(fileName: string) {
  const baseName = fileName.replace(/\.zip$/i, "").trim();

  return `${slugifyProjectTitle(baseName)}.zip`;
}

export function validateProjectArchiveCandidate(
  file: ProjectArchiveCandidate,
) {
  if (file.size <= 0) {
    throw new Error("Thư mục đang chọn không có tệp hợp lệ để tải lên.");
  }

  if (file.size > PROJECT_ARCHIVE_MAX_SIZE_BYTES) {
    throw new Error(
      `File ZIP sau khi đóng gói vượt quá giới hạn ${formatFileSize(PROJECT_ARCHIVE_MAX_SIZE_BYTES)}.`,
    );
  }

  const hasSupportedMimeType = PROJECT_ARCHIVE_ALLOWED_MIME_TYPES.includes(
    file.type as (typeof PROJECT_ARCHIVE_ALLOWED_MIME_TYPES)[number],
  );

  if (!hasSupportedMimeType && !file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Chỉ hỗ trợ tải lên thư mục dưới dạng file ZIP.");
  }
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const fractionDigits = size >= 10 || unitIndex === 0 ? 0 : 1;

  return `${size.toFixed(fractionDigits)} ${units[unitIndex]}`;
}
