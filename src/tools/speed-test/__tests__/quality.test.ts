import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ClassificationName, Scores } from "@cloudflare/speedtest";
import {
  buildResultText,
  getExperienceQualities,
  rescoreAssumingNoPacketLoss,
  toQualityLevel,
} from "@/tools/speed-test/quality";

function score(classificationName: ClassificationName) {
  return { points: 1, classificationIdx: 0, classificationName };
}

describe("speed test quality", () => {
  it("maps classifications", () => {
    assert.equal(toQualityLevel("great"), "good");
    assert.equal(toQualityLevel("good"), "good");
    assert.equal(toQualityLevel("average"), "fair");
    assert.equal(toQualityLevel("poor"), "poor");
    assert.equal(toQualityLevel("bad"), "poor");
    assert.equal(toQualityLevel("weird"), "unknown");
    assert.equal(toQualityLevel(undefined), "unknown");
  });

  it("handles missing scores", () => {
    const rows = getExperienceQualities({
      streaming: score("great"),
    } satisfies Scores);

    assert.deepEqual(
      rows.map((row) => row.level),
      ["good", "unknown", "unknown"],
    );
    assert.deepEqual(
      getExperienceQualities(undefined).map((row) => row.level),
      ["unknown", "unknown", "unknown"],
    );
  });

  it("rescores assuming no packet loss", () => {
    // Engine gives 0 packet-loss points when unmeasured; full marks are 10
    const rescored = rescoreAssumingNoPacketLoss({
      gaming: { points: 10, classificationIdx: 1, classificationName: "poor" },
      streaming: { points: 55, classificationIdx: 3, classificationName: "good" },
      rtc: { points: 0, classificationIdx: 0, classificationName: "bad" },
    } satisfies Scores);

    assert.deepEqual(rescored?.gaming, {
      points: 20,
      classificationIdx: 2,
      classificationName: "average",
    });
    assert.equal(rescored?.streaming.classificationName, "great");
    assert.equal(rescored?.rtc.classificationName, "poor");
    assert.equal(rescoreAssumingNoPacketLoss(undefined), undefined);
  });

  it("builds copy text", () => {
    const text = buildResultText(
      { download: 85_300_000, upload: 32_100_000, latency: 17.6, jitter: 2.2 },
      {
        streaming: score("great"),
        gaming: score("average"),
        rtc: score("good"),
      } satisfies Scores,
      new Date(2026, 9, 14, 21, 30),
      "https://example.com",
    );

    assert.equal(
      text,
      [
        "Kết quả đo tốc độ mạng (14/10/2026 21:30)",
        "Tải xuống: 85,3 Mbps · Tải lên: 32,1 Mbps",
        "Ping: 18 ms · Dao động: 2 ms",
        "Xem video: Tốt · Chơi game: Khá · Gọi video: Tốt",
        "Đo bằng Cloudflare tại https://example.com/tools/speed-test",
      ].join("\n"),
    );
  });
});
