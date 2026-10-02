import type { MicFilterReport } from "@/tools/mic-filter/types";

// Table form of the noon result table, rendered as an image for Zalo.

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
