import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { utils, write } from "xlsx";
import {
  DEFAULT_MIC_FILTER_CONFIG,
  describeAlarmRule,
  formatClockValue,
  formatHourLabel,
  micFilterConfigSchema,
  parseClockValue,
  parseMicFilterConfig,
  type MicFilterConfig,
} from "@/tools/mic-filter/config";
import { processMicFilterFile } from "@/tools/mic-filter/processor";

function excel(rows: unknown[][]) {
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), "Sheet1");

  return new File([write(workbook, { type: "array", bookType: "xlsx" })], "a.xlsx");
}

const HEADER = ["Mã phòng", "Thời gian bắt đầu", "Thời gian kết thúc", "Ghi chú"];

describe("mic filter config", () => {
  it("cấu hình mặc định hợp lệ theo schema", () => {
    assert.equal(micFilterConfigSchema.safeParse(DEFAULT_MIC_FILTER_CONFIG).success, true);
  });

  it("chuẩn hoá danh sách phòng: viết hoa, bỏ trùng, bỏ rỗng", () => {
    const parsed = micFilterConfigSchema.parse({
      ...DEFAULT_MIC_FILTER_CONFIG,
      wirelessRooms: [" e1-05.05", "E1-05.05", "", "E1-06.07"],
    });

    assert.deepEqual(parsed.wirelessRooms, ["E1-05.05", "E1-06.07"]);
  });

  it("từ chối mã phòng sai định dạng, ca ngược giờ, rule trùng id", () => {
    const base = DEFAULT_MIC_FILTER_CONFIG;

    assert.equal(
      micFilterConfigSchema.safeParse({ ...base, wirelessRooms: ["E1-5.5"] }).success,
      false,
    );
    assert.equal(
      micFilterConfigSchema.safeParse({
        ...base,
        shifts: { ...base.shifts, morning: { startMinutes: 600, endMinutes: 500 } },
      }).success,
      false,
    );
    assert.equal(
      micFilterConfigSchema.safeParse({
        ...base,
        alarmRules: [base.alarmRules[0], base.alarmRules[0]],
      }).success,
      false,
    );
  });

  it("dữ liệu lưu bị hỏng thì quay về mặc định", () => {
    assert.equal(parseMicFilterConfig({ nope: true }), DEFAULT_MIC_FILTER_CONFIG);
    assert.equal(parseMicFilterConfig(null), DEFAULT_MIC_FILTER_CONFIG);
  });

  it("định dạng và đọc giờ", () => {
    assert.equal(formatHourLabel(9 * 60 + 20), "9h20");
    assert.equal(formatHourLabel(15 * 60), "15h");
    assert.equal(formatClockValue(7 * 60 + 5), "07:05");
    assert.equal(parseClockValue("07:30"), 450);
    assert.equal(parseClockValue("24:00"), null);
    assert.equal(parseClockValue("7h30"), null);
  });

  it("câu gợi ý của rule mặc định giữ nguyên như trước khi có cấu hình", () => {
    const [exact, range] = DEFAULT_MIC_FILTER_CONFIG.alarmRules.map(describeAlarmRule);

    assert.equal(exact.classStartLabel, "9h20");
    assert.equal(
      exact.promptMessage,
      "Phát hiện có ca học lúc 9h20. Có muốn đặt lịch thông báo lúc 9h để bật máy lạnh không?",
    );
    assert.equal(range.classStartLabel, "15h - 16h");
    assert.equal(
      range.promptMessage,
      "Phát hiện có ca học bắt đầu từ 15h đến 16h. Có muốn đặt lịch thông báo lúc 15h để bật máy lạnh không?",
    );
  });
});

describe("processMicFilterFile với cấu hình tuỳ chỉnh", () => {
  const custom: MicFilterConfig = {
    version: 1,
    wirelessRooms: ["E1-04.01"],
    shifts: {
      morning: { startMinutes: 6 * 60, endMinutes: 8 * 60 },
      afternoon: { startMinutes: 13 * 60, endMinutes: 17 * 60 },
      evening: { startMinutes: 18 * 60, endMinutes: 21 * 60 },
    },
    alarmRules: [
      {
        id: "rule-x",
        matchFromMinutes: 13 * 60,
        matchToMinutes: 13 * 60,
        alarmMinutes: 12 * 60 + 45,
        promptFromMinutes: 12 * 60,
        promptToMinutes: 13 * 60,
      },
    ],
  };

  it("dùng danh sách phòng, khung giờ ca và rule nhắc từ cấu hình", async () => {
    const report = await processMicFilterFile(
      excel([
        HEADER,
        ["E1-04.01", "07:00", "07:45", ""],
        ["E1-04.01", "13:00", "14:00", ""],
        ["E1-05.05", "07:30", "09:30", ""],
      ]),
      custom,
    );

    assert.equal(report.uniqueWirelessRoomCount, 1);
    assert.deepEqual(report.morningRows, [{ floor: "04", rooms: ["1"] }]);
    assert.deepEqual(report.middayRows[0].replaceBatteryRooms, ["1"]);
    assert.deepEqual(
      report.specialAlarmCandidates.map((candidate) => candidate.id),
      ["rule-x"],
    );
    assert.equal(report.specialAlarmCandidates[0].alarmLabel, "12h45");
  });

  it("lớp 09:00-10:00 không thuộc ca sáng 06:00-08:00 của cấu hình mới", async () => {
    const report = await processMicFilterFile(
      excel([HEADER, ["E1-04.01", "09:00", "10:00", ""]]),
      custom,
    );

    assert.deepEqual(report.morningRows, []);
  });
});
