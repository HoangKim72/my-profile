// src/components/projects/ArchiveContents.tsx
// Folder tree of a ZIP archive, rendered with native <details> (no client JS)

import { FileText, Folder } from "lucide-react";
import { formatFileSize } from "@/lib/projects/archive";
import type {
  ArchiveManifest,
  ArchiveManifestEntry,
} from "@/lib/projects/archive-manifest";

interface TreeFolder {
  name: string;
  folders: Map<string, TreeFolder>;
  files: Array<{ name: string; sizeBytes: number | null }>;
  fileCount: number;
}

function createFolder(name: string): TreeFolder {
  return { name, folders: new Map(), files: [], fileCount: 0 };
}

function buildTree(entries: ArchiveManifestEntry[]) {
  const root = createFolder("");

  for (const entry of entries) {
    const segments = entry.path.split("/").filter(Boolean);
    const fileName = segments.pop();

    if (!fileName) {
      continue;
    }

    let current = root;
    current.fileCount += 1;

    for (const segment of segments) {
      let next = current.folders.get(segment);

      if (!next) {
        next = createFolder(segment);
        current.folders.set(segment, next);
      }

      next.fileCount += 1;
      current = next;
    }

    current.files.push({ name: fileName, sizeBytes: entry.sizeBytes });
  }

  return root;
}

function FolderNode({ folder, depth }: { folder: TreeFolder; depth: number }) {
  return (
    <ul className={depth > 0 ? "ml-4 border-l border-gray-200 pl-3 dark:border-gray-800" : ""}>
      {[...folder.folders.values()].map((child) => (
        <li key={child.name}>
          <details open={depth < 1}>
            <summary className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Folder size={15} className="shrink-0 text-amber-500" />
              <span className="font-medium">{child.name}</span>
              <span className="text-xs text-gray-500">{child.fileCount} file</span>
            </summary>
            <FolderNode folder={child} depth={depth + 1} />
          </details>
        </li>
      ))}
      {folder.files.map((file) => (
        <li
          key={file.name}
          className="flex items-center gap-2 px-2 py-1 text-gray-700 dark:text-gray-300"
        >
          <FileText size={15} className="shrink-0 text-gray-400" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          {file.sizeBytes !== null && (
            <span className="shrink-0 text-xs text-gray-500">
              {formatFileSize(file.sizeBytes)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ArchiveContents({ manifest }: { manifest: ArchiveManifest }) {
  const tree = buildTree(manifest.entries);
  const hiddenCount = manifest.totalFiles - manifest.entries.length;

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">Bên trong file ZIP</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {manifest.totalFiles.toLocaleString("vi-VN")} file
          {manifest.totalUncompressedBytes !== null &&
            ` • ${formatFileSize(manifest.totalUncompressedBytes)} sau khi giải nén`}
        </p>
      </div>
      <div className="max-h-[28rem] overflow-auto rounded-2xl border border-gray-200 p-3 text-sm dark:border-gray-800">
        <FolderNode folder={tree} depth={0} />
        {manifest.truncated && hiddenCount > 0 && (
          <p className="px-2 pt-2 text-xs text-gray-500">
            … và {hiddenCount.toLocaleString("vi-VN")} file khác.
          </p>
        )}
      </div>
    </section>
  );
}
