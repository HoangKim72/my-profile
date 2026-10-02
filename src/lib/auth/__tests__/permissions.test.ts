import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canCreateProject,
  canDeleteProject,
  canEditProject,
} from "@/lib/auth/permissions";

describe("project permissions", () => {
  it("chỉ admin được tạo tài liệu mới", () => {
    assert.equal(canCreateProject("admin"), true);
    assert.equal(canCreateProject("viewer"), false);
    assert.equal(canCreateProject("guest"), false);
  });

  it("viewer chỉ sửa được khi là tác giả hoặc được share EDIT", () => {
    assert.equal(canEditProject("viewer"), false);
    assert.equal(canEditProject("viewer", false, "VIEW"), false);
    assert.equal(canEditProject("viewer", false, "EDIT"), true);
    assert.equal(canEditProject("viewer", true), true);
    assert.equal(canEditProject("admin"), true);
  });

  it("share EDIT không được xoá", () => {
    assert.equal(canDeleteProject("viewer"), false);
    assert.equal(canDeleteProject("admin"), true);
  });
});
