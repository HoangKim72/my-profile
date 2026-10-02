import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createEmptySession,
  parseMicSession,
  serializeMicSession,
} from "@/tools/mic-filter/session";
import { buildMiddayExportTable } from "@/tools/mic-filter/export";
import type { MicFilterReport } from "@/tools/mic-filter/types";

const morning = new Date(2026, 9, 3, 8, 0);

const report: MicFilterReport = {
  fileName: "lich.xlsx",
  sheetName: "Sheet1",
  hasStudyDateColumn: true,
  studyDateKey: "2026-10-03",
  studyDateLabel: "03/10/2026",
  totalScheduleCount: 4,
  wirelessScheduleCount: 4,
  ignoredScheduleCount: 0,
  uniqueWirelessRoomCount: 3,
  morningRoomCount: 2,
  middayActionCount: 3,
  morningRows: [
    { floor: "05", rooms: ["5", "7"] },
  ],
  middayRows: [
    { floor: "05", collectRooms: ["5"], distributeRooms: [], replaceBatteryRooms: ["7"] },
    { floor: "06", collectRooms: [], distributeRooms: ["8"], replaceBatteryRooms: [] },
  ],
  specialAlarmCandidates: [],
};

describe("mic session", () => {
  it("lưu rồi đọc lại được trong cùng ngày", () => {
    const session = {
      ...createEmptySession(morning),
      report,
    };
    session.summary.acIncrease = 2;
    session.summary.roomFeedbackDetails = ["Phòng 5.05 hỏng loa"];

    const restored = parseMicSession(serializeMicSession(session), new Date(2026, 9, 3, 16, 0));

    assert.deepEqual(restored, session);
  });

  it("bỏ phiên của ngày khác", () => {
    const raw = serializeMicSession(createEmptySession(morning));

    assert.equal(parseMicSession(raw, new Date(2026, 9, 4, 7, 0)), null);
  });

  it("bỏ dữ liệu hỏng, vá các trường sai kiểu và bỏ checklist cũ", () => {
    assert.equal(parseMicSession("{oops", morning), null);
    assert.equal(parseMicSession(JSON.stringify({ version: 2 }), morning), null);

    const restored = parseMicSession(
      JSON.stringify({
        version: 1,
        dayKey: "2026-10-03",
        report: { random: true },
        checked: ["a", 1],
        summary: { shift: "night", acIncrease: -3, usedBatteryCount: 4 },
      }),
      morning,
    );

    assert.equal(restored?.report, null);
    assert.equal(restored !== null && "checked" in restored, false);
    assert.equal(restored?.summary.shift, "morning");
    assert.equal(restored?.summary.acIncrease, 0);
    assert.equal(restored?.summary.usedBatteryCount, 4);
  });

  it("ca mặc định theo giờ mở tool", () => {
    assert.equal(createEmptySession(morning).summary.shift, "morning");
    assert.equal(createEmptySession(new Date(2026, 9, 3, 13, 0)).summary.shift, "afternoon");
    assert.equal(createEmptySession(morning).summary.summaryDate, "03/10/2026");
  });
});

describe("mic export", () => {
  it("bảng cho ảnh dùng '-' cho ô trống", () => {
    assert.deepEqual(buildMiddayExportTable(report).rows, [
      ["05", "5", "-", "7"],
      ["06", "-", "8", "-"],
    ]);
  });
});
