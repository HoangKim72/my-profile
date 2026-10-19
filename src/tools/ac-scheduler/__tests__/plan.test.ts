import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { read, utils } from "xlsx";
import { DEFAULT_AC_SCHEDULER_CONFIG } from "@/tools/ac-scheduler/config";
import { parseAcScheduleSheet, type AcScheduleRow } from "@/tools/ac-scheduler/parser";
import {
  AcPlanError,
  acLocalTimeToDate,
  buildAcPlan,
  classifyTurnOn,
  formatMinutes,
  getAcNowMinutes,
  getAcTodayKey,
  isCancelledNote,
  type AcUnitRef,
} from "@/tools/ac-scheduler/plan";

const FIXTURE = path.join(__dirname, "fixtures", "lich-201026.xlsx");
const FIXTURE_DAY = "2026-10-20";

const UNITS: AcUnitRef[] = [
  { id: "vo", name: "E1-12-02", roomCodes: ["E1-12.02"] },
  { id: "p311", name: "E1-03-11 A", roomCodes: ["E1-03.11"] },
  { id: "p311b", name: "E1-03-11 B", roomCodes: ["E1-03.11"] },
  { id: "m1", name: "E1-04-01", roomCodes: ["E1-04.05/1"] },
  { id: "m10", name: "E1-10-04", roomCodes: ["E1-10.04/2"] },
];

function readFixture() {
  const workbook = read(readFileSync(FIXTURE), { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return parseAcScheduleSheet(utils.sheet_to_json(sheet, { header: 1, raw: false, defval: null }));
}

function row(partial: Partial<AcScheduleRow> & Pick<AcScheduleRow, "roomCode">): AcScheduleRow {
  return {
    rowNumber: 2,
    dateKey: FIXTURE_DAY,
    startMinutes: 7 * 60 + 30,
    endMinutes: 11 * 60 + 40,
    note: null,
    ...partial,
  };
}

const plan = (rows: AcScheduleRow[], units = UNITS) =>
  buildAcPlan(rows, { todayKey: FIXTURE_DAY, units, config: DEFAULT_AC_SCHEDULER_CONFIG });

const windowsOf = (result: ReturnType<typeof plan>, unitId: string) =>
  result.windows
    .filter((window) => window.unitId === unitId)
    .map((window) => `${formatMinutes(window.onAtMinutes)}-${formatMinutes(window.offAtMinutes)}`);

describe("buildAcPlan with the real schedule file", () => {
  const rows = readFixture();
  const result = plan(rows);

  it("reads every line of the sheet", () => {
    assert.equal(rows.length, 222);
    assert.equal(result.totalRows, 222);
  });

  it("skips rooms outside E1", () => {
    const outside = result.skipped.filter((item) => item.reason === "not-building");
    assert.ok(outside.some((item) => item.roomCode === "E2-07.02/1"));
    assert.ok(outside.some((item) => item.roomCode === "ONLINE10"));
    assert.ok(outside.every((item) => !item.roomCode.startsWith("E1-")));
  });

  it("turns the martial arts room on 20 minutes early and off at the end", () => {
    assert.deepEqual(windowsOf(result, "vo"), ["17:40-20:30"]);
  });

  it("keeps a unit running across back-to-back classes", () => {
    // 07:30–11:40, 12:30–16:40, 16:40–20:30: the lunch gap is longer than the lead
    assert.deepEqual(windowsOf(result, "p311"), ["07:10-11:40", "12:10-20:30"]);
    assert.deepEqual(windowsOf(result, "p311b"), ["07:10-11:40", "12:10-20:30"]);
  });

  it("skips only the cancelled line of a room", () => {
    // E1-10.04/2 morning "Đã báo nghỉ", afternoon normal
    assert.deepEqual(windowsOf(result, "m10"), ["12:10-16:40"]);
    assert.ok(result.skipped.some((item) => item.roomCode === "E1-10.04/2" && item.reason === "cancelled"));
  });

  it("lists E1 rooms without an air conditioner", () => {
    assert.ok(result.unmappedRooms.includes("E1-12.01/1"));
    assert.ok(result.unmappedRooms.includes("E1-12.01/3"));
    assert.ok(!result.unmappedRooms.includes("E1-12.02"));
  });

  it("does not treat 'Khong phat mic' as a cancellation or a warning", () => {
    const withUnit = plan(rows, [...UNITS, { id: "p505", name: "E1-05-05", roomCodes: ["E1-05.05"] }]);
    assert.deepEqual(windowsOf(withUnit, "p505"), ["06:20-20:30"]);
    assert.equal(withUnit.noteWarnings.length, 0);
  });

  it("rejects the file on any other day", () => {
    assert.throws(
      () => buildAcPlan(rows, { todayKey: "2026-10-19", units: UNITS, config: DEFAULT_AC_SCHEDULER_CONFIG }),
      (error: unknown) => error instanceof AcPlanError && /20\/10\/2026.*19\/10\/2026/.test(error.message),
    );
  });
});

describe("buildAcPlan safety checks", () => {
  it("rejects a file that mixes several days", () => {
    assert.throws(
      () => plan([row({ roomCode: "E1-12.02" }), row({ roomCode: "E1-12.02", dateKey: "2026-10-21" })]),
      AcPlanError,
    );
  });

  it("rejects an E1 row with broken times but ignores broken rows elsewhere", () => {
    assert.throws(() => plan([row({ roomCode: "E1-12.02", startMinutes: null })]), AcPlanError);
    assert.throws(() => plan([row({ roomCode: "E1-12.02", startMinutes: 600, endMinutes: 600 })]), AcPlanError);
    assert.throws(() => plan([row({ roomCode: "E1-12.02", endMinutes: 23 * 60 })]), AcPlanError);
    assert.doesNotThrow(() => plan([row({ roomCode: "E2-01.01", startMinutes: null })]));
  });

  it("recognises cancellation notes with or without accents", () => {
    assert.ok(isCancelledNote("Đã báo nghỉ"));
    assert.ok(isCancelledNote("Da bao nghi"));
    assert.ok(isCancelledNote("  ĐÃ BÁO NGHỈ  "));
    assert.ok(!isCancelledNote("Khong phat mic"));
    assert.ok(!isCancelledNote(null));
  });

  it("flags unusual notes for a human to read", () => {
    const result = plan([row({ roomCode: "E1-12.02", note: "Đổi sang phòng khác" })]);
    assert.equal(result.noteWarnings.length, 1);
    assert.equal(result.windows.length, 1);
  });

  it("only uses units that serve the room", () => {
    const result = plan([row({ roomCode: "E1-04.05/2" })]);
    assert.equal(result.windows.length, 0);
    assert.deepEqual(result.unmappedRooms, ["E1-04.05/2"]);
  });

  it("counts the peak number of units running together", () => {
    const result = plan([
      row({ roomCode: "E1-12.02" }),
      row({ roomCode: "E1-03.11" }),
      row({ roomCode: "E1-04.05/1", startMinutes: 13 * 60, endMinutes: 14 * 60 }),
    ]);
    assert.equal(result.peakConcurrentUnits, 3);
  });
});

describe("classifyTurnOn", () => {
  const window = { onAtMinutes: 17 * 60 + 40, offAtMinutes: 20 * 60 + 30 };
  const config = { minRemainingMinutes: 30 };

  it("waits when the tool is used early", () => {
    assert.deepEqual(classifyTurnOn(9 * 60, window, config), { kind: "scheduled" });
  });

  it("turns on late while at least 30 minutes remain", () => {
    assert.deepEqual(classifyTurnOn(18 * 60, window, config), { kind: "late", lateMinutes: 20 });
    assert.deepEqual(classifyTurnOn(20 * 60, window, config), { kind: "late", lateMinutes: 140 });
  });

  it("skips when less than 30 minutes remain or the class is over", () => {
    assert.deepEqual(classifyTurnOn(20 * 60 + 1, window, config), { kind: "too-late" });
    assert.deepEqual(classifyTurnOn(21 * 60, window, config), { kind: "too-late" });
  });
});

describe("Vietnam time helpers", () => {
  it("uses UTC+7 regardless of the server time zone", () => {
    const lateEvening = new Date("2026-10-19T17:30:00Z"); // 00:30 on the 20th in Vietnam
    assert.equal(getAcTodayKey(lateEvening), "2026-10-20");
    assert.equal(getAcNowMinutes(lateEvening), 30);
    assert.equal(acLocalTimeToDate("2026-10-20", 17 * 60 + 40).toISOString(), "2026-10-20T10:40:00.000Z");
  });
});
