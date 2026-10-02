import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { utils, write } from "xlsx";
import { processMicFilterFile } from "@/tools/mic-filter/processor";

const HEADER = [
  "Mã phòng",
  "Ngày học",
  "Thời gian bắt đầu",
  "Thời gian kết thúc",
  "Ghi chú",
];

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function buildExcelFile(rows: unknown[][], fileName = "lich-hoc.xlsx") {
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), "Sheet1");
  const buffer = write(workbook, { type: "array", bookType: "xlsx" });

  return new File([buffer], fileName, { type: XLSX_MIME });
}

describe("processMicFilterFile", () => {
  it("phân loại phòng vào bảng sáng và bảng giữa trưa", async () => {
    const file = buildExcelFile([
      HEADER,
      // sáng only → phát sáng + thu trưa
      ["E1-05.05", "02/10/2026", "07:30", "09:30", ""],
      // chiều only → phát trưa
      ["E1-05.07", "02/10/2026", "13:00", "15:00", ""],
      // sáng + chiều → thay pin
      ["E1-06.05", "02/10/2026", "07:30", "11:30", ""],
      ["E1-06.05", "02/10/2026", "12:30", "16:30", ""],
      // không phải phòng mic không dây → bỏ qua
      ["E1-04.01", "02/10/2026", "07:30", "09:30", ""],
    ]);

    const report = await processMicFilterFile(file);

    assert.equal(report.totalScheduleCount, 5);
    assert.equal(report.wirelessScheduleCount, 4);
    assert.equal(report.ignoredScheduleCount, 1);
    assert.equal(report.uniqueWirelessRoomCount, 3);
    assert.equal(report.studyDateLabel, "02/10/2026");

    assert.deepEqual(report.morningRows, [
      { floor: "05", rooms: ["5"] },
      { floor: "06", rooms: ["5"] },
    ]);
    assert.equal(report.morningRoomCount, 2);

    assert.deepEqual(report.middayRows, [
      {
        floor: "05",
        collectRooms: ["5"],
        distributeRooms: ["7"],
        replaceBatteryRooms: [],
      },
      {
        floor: "06",
        collectRooms: [],
        distributeRooms: [],
        replaceBatteryRooms: ["5"],
      },
    ]);
    assert.equal(report.middayActionCount, 3);
  });

  it("không phát mic cho lớp đã báo nghỉ hoặc ghi 'không phát mic'", async () => {
    const file = buildExcelFile([
      HEADER,
      ["E1-07.01", "", "07:30", "09:30", "Đã báo nghỉ"],
      ["E1-07.03", "", "13:00", "15:00", "Lớp này KHÔNG PHÁT MIC"],
    ]);

    const report = await processMicFilterFile(file);

    assert.equal(report.uniqueWirelessRoomCount, 2);
    assert.deepEqual(report.morningRows, []);
    assert.deepEqual(report.middayRows, []);
  });

  it("chấp nhận file không có cột Ngày học", async () => {
    const file = buildExcelFile([
      ["Mã phòng", "Thời gian bắt đầu", "Thời gian kết thúc", "Ghi chú"],
      ["e1-08.05", "07:30", "09:30", null],
    ]);

    const report = await processMicFilterFile(file);

    assert.equal(report.hasStudyDateColumn, false);
    assert.equal(report.studyDateLabel, null);
    assert.deepEqual(report.morningRows, [{ floor: "08", rooms: ["5"] }]);
  });

  it("không gán nhãn ngày khi file chứa nhiều ngày", async () => {
    const file = buildExcelFile([
      HEADER,
      ["E1-05.05", "02/10/2026", "07:30", "09:30", ""],
      ["E1-05.07", "03/10/2026", "07:30", "09:30", ""],
    ]);

    const report = await processMicFilterFile(file);

    assert.equal(report.studyDateKey, null);
  });

  it("báo lỗi khi thiếu cột bắt buộc", async () => {
    const file = buildExcelFile([
      ["Mã phòng", "Thời gian bắt đầu", "Ghi chú"],
      ["E1-05.05", "07:30", ""],
    ]);

    await assert.rejects(processMicFilterFile(file), /Thời gian kết thúc/);
  });

  it("báo lỗi kèm số dòng khi giờ bắt đầu không nhỏ hơn giờ kết thúc", async () => {
    const file = buildExcelFile([
      HEADER,
      ["E1-05.05", "", "07:30", "09:30", ""],
      ["E1-05.07", "", "10:00", "09:00", ""],
    ]);

    await assert.rejects(processMicFilterFile(file), /dòng 3/);
  });

  it("báo lỗi khi thiếu mã phòng", async () => {
    const file = buildExcelFile([HEADER, ["", "", "07:30", "09:30", "x"]]);

    await assert.rejects(processMicFilterFile(file), /thiếu Mã phòng/);
  });

  it("từ chối file không phải Excel", async () => {
    const file = new File(["a,b"], "lich.csv", { type: "text/csv" });

    await assert.rejects(processMicFilterFile(file), /\.xls hoặc \.xlsx/);
  });

  it("chỉ gợi ý báo máy lạnh từ các lớp không bị bỏ qua", async () => {
    const file = buildExcelFile([
      HEADER,
      ["E1-05.05", "", "09:20", "11:00", ""],
      ["E1-05.07", "", "09:20", "11:00", "Đã báo nghỉ"],
      ["E1-04.01", "", "15:30", "17:00", ""],
    ]);

    const report = await processMicFilterFile(file);
    const ids = report.specialAlarmCandidates.map((item) => item.id);

    assert.deepEqual(ids, ["aircon-0920", "aircon-1520"]);
    assert.deepEqual(report.specialAlarmCandidates[0].matchedRooms, ["05.5"]);
    // Rule máy lạnh áp dụng cho mọi phòng, không chỉ phòng mic không dây
    assert.deepEqual(report.specialAlarmCandidates[1].matchedRooms, ["04.1"]);
  });
});
