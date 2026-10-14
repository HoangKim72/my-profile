import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ENGINE_OPTIONS,
  MEASUREMENTS,
  estimateMaxBytes,
} from "@/tools/speed-test/config";

describe("speed test config", () => {
  it("never measures packet loss", () => {
    assert.ok(MEASUREMENTS.every((m) => m.type !== "packetLoss"));
  });

  it("disables result logging", () => {
    assert.equal(ENGINE_OPTIONS.logAimApiUrl, null);
  });

  it("caps data at ~146 MB", () => {
    const { download, upload } = estimateMaxBytes(MEASUREMENTS);

    assert.equal(download, 99_000_000);
    assert.equal(upload, 46_800_000);
  });
});
