import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatMbps,
  formatMegabytes,
  formatMs,
} from "@/tools/speed-test/format";

describe("speed test formatting", () => {
  it("formats Mbps", () => {
    assert.equal(formatMbps(85_300_000), "85,3");
    assert.equal(formatMbps(400_000), "0,4");
    assert.equal(formatMbps(950_400_000), "950");
    assert.equal(formatMbps(100_000_000), "100");
  });

  it("shows a dash when missing", () => {
    // The engine reports 0 for a category that started but has no samples yet
    for (const value of [undefined, NaN, -1, 0]) {
      assert.equal(formatMbps(value), "—");
      assert.equal(formatMs(value), "—");
    }
  });

  it("formats ms as integers", () => {
    assert.equal(formatMs(17.6), "18");
    assert.equal(formatMs(0.4), "0");
  });

  it("formats megabytes", () => {
    assert.equal(formatMegabytes(146_000_000), "146");
  });
});
