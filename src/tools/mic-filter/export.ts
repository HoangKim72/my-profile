import type { MicFilterReport } from "@/tools/mic-filter/types";

// Plain-text and table forms of the two result tables, for pasting into Zalo
// or rendering as an image.

export interface ExportTable {
  title: string;
  headers: string[];
  rows: string[][];
  emptyMessage: string;
}

function withDate(title: string, report: MicFilterReport) {
  return report.studyDateLabel ? `${title} – ${report.studyDateLabel}` : title;
}

function joinRooms(rooms: string[]) {
  return rooms.length > 0 ? rooms.join(", ") : "-";
}

export function buildMorningExportTable(report: MicFilterReport): ExportTable {
  return {
    title: withDate("Soạn mic ca sáng", report),
    headers: ["Tầng", "Phòng"],
    rows: report.morningRows.map((row) => [row.floor, joinRooms(row.rooms)]),
    emptyMessage: "Không có phòng mic không dây nào dùng trong ca sáng.",
  };
}

export function buildMiddayExportTable(report: MicFilterReport): ExportTable {
  return {
    title: withDate("Thu, Phát, Thay pin buổi trưa", report),
    headers: ["Tầng", "Thu", "Phát", "Thay pin"],
    rows: report.middayRows.map((row) => [
      row.floor,
      joinRooms(row.collectRooms),
      joinRooms(row.distributeRooms),
      joinRooms(row.replaceBatteryRooms),
    ]),
    emptyMessage: "Không có thao tác buổi trưa nào.",
  };
}

export function buildMorningText(report: MicFilterReport) {
  const lines = report.morningRows.map(
    (row) => `- Tầng ${row.floor}: ${row.rooms.join(", ")}`,
  );

  return [
    `${withDate("Soạn mic ca sáng", report)}:`,
    ...(lines.length > 0 ? lines : ["- Không có phòng nào."]),
  ].join("\n");
}

export function buildMiddayText(report: MicFilterReport) {
  const lines = report.middayRows.map((row) => {
    const parts = [
      row.collectRooms.length > 0 ? `Thu ${row.collectRooms.join(", ")}` : null,
      row.distributeRooms.length > 0
        ? `Phát ${row.distributeRooms.join(", ")}`
        : null,
      row.replaceBatteryRooms.length > 0
        ? `Thay pin ${row.replaceBatteryRooms.join(", ")}`
        : null,
    ].filter(Boolean);

    return `- Tầng ${row.floor}: ${parts.join(" | ")}`;
  });

  return [
    `${withDate("Thu, Phát, Thay pin buổi trưa", report)}:`,
    ...(lines.length > 0 ? lines : ["- Không có thao tác nào."]),
  ].join("\n");
}
