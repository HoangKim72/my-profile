import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildChecklistKey,
  createEmptySession,
  getChecklistProgress,
  parseMicSession,
  serializeMicSession,
} from "@/tools/mic-filter/session";
import {
  buildMiddayExportTable,
  buildMiddayText,
  buildMorningText,
} from "@/tools/mic-filter/export";
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
      checked: [buildChecklistKey("morning", "05", "5")],
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

  it("bỏ dữ liệu hỏng và vá các trường sai kiểu", () => {
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
    assert.deepEqual(restored?.checked, ["a"]);
    assert.equal(restored?.summary.shift, "morning");
    assert.equal(restored?.summary.acIncrease, 0);
    assert.equal(restored?.summary.usedBatteryCount, 4);
  });

  it("ca mặc định theo giờ mở tool", () => {
    assert.equal(createEmptySession(morning).summary.shift, "morning");
    assert.equal(createEmptySession(new Date(2026, 9, 3, 13, 0)).summary.shift, "afternoon");
    assert.equal(createEmptySession(morning).summary.summaryDate, "03/10/2026");
  });

  it("đếm tiến độ checklist theo từng loại", () => {
    const progress = getChecklistProgress(
      report,
      new Set([
        buildChecklistKey("morning", "05", "5"),
        buildChecklistKey("replaceBattery", "05", "7"),
        buildChecklistKey("collect", "06", "5"), // không tồn tại trong bảng
      ]),
    );

    assert.deepEqual(progress, {
      morning: { done: 1, total: 2 },
      collect: { done: 0, total: 1 },
      distribute: { done: 0, total: 1 },
      replaceBattery: { done: 1, total: 1 },
    });
  });
});

describe("mic export", () => {
  it("xuất bảng sáng dạng chữ", () => {
    assert.equal(
      buildMorningText(report),
      "Soạn mic ca sáng – 03/10/2026:\n- Tầng 05: 5, 7",
    );
  });

  it("xuất bảng trưa dạng chữ, bỏ nhóm rỗng", () => {
    assert.equal(
      buildMiddayText(report),
      "Thu, Phát, Thay pin buổi trưa – 03/10/2026:\n- Tầng 05: Thu 5 | Thay pin 7\n- Tầng 06: Phát 8",
    );
  });

  it("báo khi không có phòng nào", () => {
    const empty = { ...report, morningRows: [], studyDateLabel: null };

    assert.equal(buildMorningText(empty), "Soạn mic ca sáng:\n- Không có phòng nào.");
  });

  it("bảng cho ảnh dùng '-' cho ô trống", () => {
    assert.deepEqual(buildMiddayExportTable(report).rows, [
      ["05", "5", "-", "7"],
      ["06", "-", "8", "-"],
    ]);
  });
});
