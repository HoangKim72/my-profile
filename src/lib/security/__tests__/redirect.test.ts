import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getSafeRedirectPath } from "@/lib/security/redirect";

describe("getSafeRedirectPath", () => {
  it("giữ nguyên đường dẫn nội bộ hợp lệ", () => {
    assert.equal(getSafeRedirectPath("/dashboard/projects"), "/dashboard/projects");
    assert.equal(getSafeRedirectPath("/projects?tab=1#top"), "/projects?tab=1#top");
  });

  it("dùng fallback khi thiếu tham số", () => {
    assert.equal(getSafeRedirectPath(null), "/dashboard");
    assert.equal(getSafeRedirectPath(undefined, "/about"), "/about");
    assert.equal(getSafeRedirectPath(""), "/dashboard");
  });

  for (const payload of [
    "@evil.com",
    "evil.com",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "/\tevil",
    " //evil.com",
  ]) {
    it(`chặn ${JSON.stringify(payload)}`, () => {
      assert.equal(getSafeRedirectPath(payload), "/dashboard");
    });
  }
});
