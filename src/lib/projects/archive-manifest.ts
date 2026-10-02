import JSZip from "jszip";

// Enough to preview a folder without bloating the row for huge archives
export const ARCHIVE_MANIFEST_MAX_ENTRIES = 500;

export interface ArchiveManifestEntry {
  path: string;
  sizeBytes: number | null;
}

export interface ArchiveManifest {
  version: 1;
  totalFiles: number;
  totalUncompressedBytes: number | null;
  entries: ArchiveManifestEntry[];
  truncated: boolean;
}

interface ZipObjectWithSize {
  // JSZip keeps the central-directory size here; it is not part of the typed
  // public API, so we read it defensively and fall back to null.
  _data?: { uncompressedSize?: number };
}

export async function buildArchiveManifest(
  data: ArrayBuffer | Uint8Array,
): Promise<ArchiveManifest> {
  let zip: JSZip;

  try {
    zip = await JSZip.loadAsync(data);
  } catch {
    throw new Error("File ZIP không hợp lệ hoặc đã bị hỏng.");
  }

  const files = Object.values(zip.files)
    .filter((file) => !file.dir && !isJunkPath(file.name))
    .map((file) => ({
      path: file.name,
      sizeBytes: readUncompressedSize(file),
    }))
    .sort((left, right) =>
      left.path.localeCompare(right.path, "vi-VN", { numeric: true }),
    );

  const hasAllSizes = files.every((file) => file.sizeBytes !== null);

  return {
    version: 1,
    totalFiles: files.length,
    totalUncompressedBytes: hasAllSizes
      ? files.reduce((total, file) => total + (file.sizeBytes ?? 0), 0)
      : null,
    entries: files.slice(0, ARCHIVE_MANIFEST_MAX_ENTRIES),
    truncated: files.length > ARCHIVE_MANIFEST_MAX_ENTRIES,
  };
}

export function parseArchiveManifest(value: unknown): ArchiveManifest | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<ArchiveManifest>;

  if (candidate.version !== 1 || !Array.isArray(candidate.entries)) {
    return null;
  }

  return {
    version: 1,
    totalFiles: Number(candidate.totalFiles) || candidate.entries.length,
    totalUncompressedBytes:
      typeof candidate.totalUncompressedBytes === "number"
        ? candidate.totalUncompressedBytes
        : null,
    entries: candidate.entries
      .filter(
        (entry): entry is ArchiveManifestEntry =>
          !!entry && typeof entry.path === "string",
      )
      .map((entry) => ({
        path: entry.path,
        sizeBytes: typeof entry.sizeBytes === "number" ? entry.sizeBytes : null,
      })),
    truncated: Boolean(candidate.truncated),
  };
}

function readUncompressedSize(file: JSZip.JSZipObject) {
  const size = (file as unknown as ZipObjectWithSize)._data?.uncompressedSize;

  return typeof size === "number" && Number.isFinite(size) && size >= 0
    ? size
    : null;
}

function isJunkPath(path: string) {
  return (
    path.startsWith("__MACOSX/") ||
    path.split("/").some((segment) => segment === ".DS_Store" || segment === "Thumbs.db")
  );
}
