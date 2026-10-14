import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MEASUREMENTS } from "@/tools/speed-test/config";
import {
  buildFinalAnnouncement,
  isCategoryDone,
} from "@/tools/speed-test/phases";

describe("speed test phases", () => {
  it("treats a finished bandwidth category as done", () => {
    assert.equal(isCategoryDone("download", true, 4, MEASUREMENTS), true);
    assert.equal(isCategoryDone("upload", false, 6, MEASUREMENTS), false);
  });

  it("only treats latency as done after its last round", () => {
    // MEASUREMENTS[0] is the 1-packet probe, MEASUREMENTS[2] the 20-packet round
    assert.equal(isCategoryDone("latency", true, 0, MEASUREMENTS), false);
    assert.equal(isCategoryDone("latency", true, 2, MEASUREMENTS), true);
    assert.equal(isCategoryDone("latency", false, 2, MEASUREMENTS), false);
  });

  it("announces every final value when the run ends", () => {
    assert.equal(
      buildFinalAnnouncement({
        download: 106_000_000,
        upload: 69_500_000,
        latency: 42.2,
      }),
      "Đã đo xong. Tải xuống 106 Mbps, tải lên 69,5 Mbps, ping 42 ms.",
    );
  });
});
