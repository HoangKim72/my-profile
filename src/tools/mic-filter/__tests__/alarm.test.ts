import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAlarmSchedulePlan,
  buildSpecialAlarmCandidates,
  getSpecialAlarmOfferState,
} from "@/tools/mic-filter/alarm";
import type { ParsedMicScheduleRow } from "@/tools/mic-filter/types";

function row(roomCode: string, startMinutes: number): ParsedMicScheduleRow {
  const [, floor, room] = /^E1-(\d{2})\.(\d{2})$/.exec(roomCode)!;

  return {
    rowNumber: 2,
    roomCode,
    roomNumber: room,
    roomDisplay: String(Number(room)),
    studyDateKey: null,
    studyDateLabel: null,
    startMinutes,
    endMinutes: startMinutes + 90,
    note: null,
    isIgnoredForMic: false,
    building: "E1",
    floor,
    usesMorning: false,
    usesAfternoon: false,
    usesEvening: false,
  };
}

const at = (hours: number, minutes = 0) =>
  new Date(2026, 9, 2, hours, minutes, 0, 0);

describe("buildSpecialAlarmCandidates", () => {
  it("không có ca khớp thì không có gợi ý", () => {
    assert.deepEqual(buildSpecialAlarmCandidates([row("E1-05.05", 7 * 60 + 30)]), []);
  });

  it("9h20 phải khớp đúng phút", () => {
    const candidates = buildSpecialAlarmCandidates([
      row("E1-05.05", 9 * 60 + 20),
      row("E1-05.07", 9 * 60 + 25),
    ]);

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].id, "aircon-0920");
    assert.equal(candidates[0].matchedScheduleCount, 1);
  });

  it("khung 15h-16h tính cả hai biên, gộp và sắp xếp phòng", () => {
    const candidates = buildSpecialAlarmCandidates([
      row("E1-06.10", 16 * 60),
      row("E1-06.05", 15 * 60),
      row("E1-06.05", 15 * 60 + 30),
      row("E1-06.07", 16 * 60 + 1),
    ]);

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].id, "aircon-1520");
    assert.equal(candidates[0].matchedScheduleCount, 3);
    assert.deepEqual(candidates[0].matchedRooms, ["06.5", "06.10"]);
  });
});

describe("getSpecialAlarmOfferState", () => {
  const [candidate] = buildSpecialAlarmCandidates([row("E1-05.05", 9 * 60 + 20)]);

  it("trước 5h là quá sớm", () => {
    assert.equal(getSpecialAlarmOfferState(candidate, at(4, 59)).reason, "too-early");
  });

  it("trong khung 5h - 9h20 thì hiện gợi ý", () => {
    assert.equal(getSpecialAlarmOfferState(candidate, at(5)).shouldShow, true);
    assert.equal(getSpecialAlarmOfferState(candidate, at(9, 20)).shouldShow, true);
  });

  it("sau 9h20 là quá muộn", () => {
    assert.equal(getSpecialAlarmOfferState(candidate, at(9, 21)).reason, "too-late");
  });
});

describe("buildAlarmSchedulePlan", () => {
  const [candidate] = buildSpecialAlarmCandidates([row("E1-05.05", 9 * 60 + 20)]);

  it("đặt hẹn giờ tới 9h khi còn sớm", () => {
    const plan = buildAlarmSchedulePlan(candidate, at(8, 30));

    assert.equal(plan.shouldTriggerImmediately, false);
    assert.equal(plan.delayMs, 30 * 60 * 1000);
    assert.equal(plan.targetDate.getHours(), 9);
    assert.equal(plan.classStartDate.getMinutes(), 20);
  });

  it("báo ngay khi đã qua giờ nhắc", () => {
    const plan = buildAlarmSchedulePlan(candidate, at(9, 5));

    assert.equal(plan.shouldTriggerImmediately, true);
    assert.equal(plan.delayMs, 0);
  });
});
