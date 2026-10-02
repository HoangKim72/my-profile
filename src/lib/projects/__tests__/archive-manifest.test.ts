import { describe, it } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import {
  ARCHIVE_MANIFEST_MAX_ENTRIES,
  buildArchiveManifest,
  parseArchiveManifest,
} from "@/lib/projects/archive-manifest";

async function zipOf(files: Record<string, string>) {
  const zip = new JSZip();

  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

describe("buildArchiveManifest", () => {
  it("liệt kê file kèm kích thước gốc, sắp xếp theo đường dẫn", async () => {
    const data = await zipOf({
      "mon-web/slide/bai-10.pdf": "x".repeat(300),
      "mon-web/slide/bai-2.pdf": "y".repeat(200),
      "mon-web/README.md": "hello",
    });

    const manifest = await buildArchiveManifest(data);

    assert.equal(manifest.totalFiles, 3);
    assert.equal(manifest.truncated, false);
    assert.deepEqual(manifest.entries, [
      { path: "mon-web/README.md", sizeBytes: 5 },
      { path: "mon-web/slide/bai-2.pdf", sizeBytes: 200 },
      { path: "mon-web/slide/bai-10.pdf", sizeBytes: 300 },
    ]);
    assert.equal(manifest.totalUncompressedBytes, 505);
  });

  it("bỏ thư mục rỗng và file rác của macOS/Windows", async () => {
    const data = await zipOf({
      "a/file.txt": "1",
      "__MACOSX/a/._file.txt": "junk",
      "a/.DS_Store": "junk",
      "a/Thumbs.db": "junk",
    });

    const manifest = await buildArchiveManifest(data);

    assert.deepEqual(
      manifest.entries.map((entry) => entry.path),
      ["a/file.txt"],
    );
  });

  it("cắt danh sách khi quá giới hạn nhưng vẫn đếm đủ tổng", async () => {
    const files: Record<string, string> = {};

    for (let index = 0; index < ARCHIVE_MANIFEST_MAX_ENTRIES + 5; index += 1) {
      files[`f/${index}.txt`] = "a";
    }

    const manifest = await buildArchiveManifest(await zipOf(files));

    assert.equal(manifest.totalFiles, ARCHIVE_MANIFEST_MAX_ENTRIES + 5);
    assert.equal(manifest.entries.length, ARCHIVE_MANIFEST_MAX_ENTRIES);
    assert.equal(manifest.truncated, true);
  });

  it("từ chối dữ liệu không phải ZIP", async () => {
    await assert.rejects(
      buildArchiveManifest(new TextEncoder().encode("not a zip")),
      /ZIP không hợp lệ/,
    );
  });
});

describe("parseArchiveManifest", () => {
  it("trả null cho dữ liệu cũ hoặc sai định dạng", () => {
    assert.equal(parseArchiveManifest(null), null);
    assert.equal(parseArchiveManifest({ entries: [] }), null);
    assert.equal(parseArchiveManifest("x"), null);
  });

  it("đọc lại manifest và lọc entry hỏng", () => {
    const manifest = parseArchiveManifest({
      version: 1,
      totalFiles: 2,
      totalUncompressedBytes: 10,
      entries: [{ path: "a.txt", sizeBytes: 10 }, { nope: true }, null],
      truncated: false,
    });

    assert.deepEqual(manifest?.entries, [{ path: "a.txt", sizeBytes: 10 }]);
    assert.equal(manifest?.totalFiles, 2);
  });
});
