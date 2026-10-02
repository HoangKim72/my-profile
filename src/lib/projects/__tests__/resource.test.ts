import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_TECH_STACK,
  parseResourceFilters,
  parseResourceTags,
  RESOURCE_TAG_MAX_COUNT,
  serializeResourceTags,
} from "@/lib/projects/resource";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/validators/project";

describe("parseResourceTags", () => {
  it("tách theo dấu phẩy/chấm phẩy/xuống dòng, bỏ trùng không phân biệt hoa thường", () => {
    assert.deepEqual(parseResourceTags(" Java, SQL;java\n  Đề   thi ,, "), [
      "Java",
      "SQL",
      "Đề thi",
    ]);
  });

  it("coi chuỗi placeholder cũ là không có tag", () => {
    assert.deepEqual(parseResourceTags(LEGACY_TECH_STACK), []);
    assert.deepEqual(parseResourceTags(null), []);
  });

  it("giới hạn số lượng tag", () => {
    const raw = Array.from({ length: 30 }, (_, index) => `tag${index}`).join(",");

    assert.equal(parseResourceTags(raw).length, RESOURCE_TAG_MAX_COUNT);
  });

  it("serialize về dạng chuẩn", () => {
    assert.equal(serializeResourceTags("a,  b ,a"), "a, b");
  });
});

describe("parseResourceFilters", () => {
  it("đọc và trim tham số, sort sai thì về mặc định", () => {
    assert.deepEqual(
      parseResourceFilters({
        q: "  java ",
        subject: ["Web", "ignored"],
        sort: "hack",
      }),
      { q: "java", subject: "Web", semester: "", sort: "newest" },
    );
  });

  it("nhận sort hợp lệ và cắt chuỗi quá dài", () => {
    const filters = parseResourceFilters({ sort: "downloads", q: "x".repeat(500) });

    assert.equal(filters.sort, "downloads");
    assert.equal(filters.q.length, 120);
  });
});

describe("project validator", () => {
  const base = {
    title: "Tài liệu Web",
    slug: "tai-lieu-web",
    shortDescription: "Slide và bài tập môn Web",
    subjectName: "Lập trình Web",
    semester: "HK1 2025-2026",
    visibility: "PUBLIC",
    status: "PUBLISHED",
  };

  it("ghi chú và tag không bắt buộc, tag được chuẩn hoá", () => {
    const parsed = createProjectSchema.parse({ ...base, techStack: "Java,java, SQL" });

    assert.equal(parsed.content, "");
    assert.equal(parsed.techStack, "Java, SQL");
  });

  it("bắt buộc môn học và kỳ học", () => {
    assert.equal(createProjectSchema.safeParse({ ...base, subjectName: " " }).success, false);
    assert.equal(createProjectSchema.safeParse({ ...base, semester: "" }).success, false);
  });

  it("update một phần không ghi đè trường không gửi lên", () => {
    const parsed = updateProjectSchema.parse({ title: "Tên mới cho tài liệu" });

    assert.equal(parsed.content, undefined);
    assert.equal(parsed.techStack, undefined);
  });
});
