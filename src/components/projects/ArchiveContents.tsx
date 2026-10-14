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
    <ul className={depth > 0 ? "ml-4 border-l border-line pl-3" : ""}>
      {[...folder.folders.values()].map((child) => (
        <li key={child.name}>
          <details open={depth < 1}>
            <summary className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-ink transition-colors hover:bg-sunken">
              <Folder size={16} className="shrink-0 text-warn" aria-hidden="true" />
              <span className="font-medium">{child.name}</span>
              <span className="text-sm text-muted">{child.fileCount} file</span>
            </summary>
            <FolderNode folder={child} depth={depth + 1} />
          </details>
        </li>
      ))}
      {folder.files.map((file) => (
        <li
          key={file.name}
          className="flex items-center gap-2 px-2 py-1.5 text-ink"
        >
          <FileText size={16} className="shrink-0 text-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate" title={file.name}>
            {file.name}
          </span>
          {file.sizeBytes !== null && (
            <span className="shrink-0 font-mono text-xs text-muted">
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
    <section aria-labelledby="ben-trong-zip">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ben-trong-zip" className="text-lg font-semibold text-ink">
          Bên trong file ZIP
        </h2>
        <p className="text-sm text-muted">
          {manifest.totalFiles.toLocaleString("vi-VN")} file
          {manifest.totalUncompressedBytes !== null &&
            ` • ${formatFileSize(manifest.totalUncompressedBytes)} sau khi giải nén`}
        </p>
      </div>
      <div className="max-h-[28rem] overflow-auto rounded-xl border border-line bg-surface p-3 text-sm"
        tabIndex={0}
        role="region"
        aria-label="Danh sách file trong ZIP">
        <FolderNode folder={tree} depth={0} />
        {manifest.truncated && hiddenCount > 0 && (
          <p className="px-2 pt-2 text-sm text-muted">
            … và {hiddenCount.toLocaleString("vi-VN")} file khác.
          </p>
        )}
      </div>
    </section>
  );
}
