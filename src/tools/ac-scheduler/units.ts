import { isBuildingRoom } from "@/tools/ac-scheduler/plan";
import { normalizeAcRoomCode } from "@/tools/ac-scheduler/parser";

// Unit list pasted by the admin. Same columns as phong_map.csv written by
// `itm_client.py quet`, plus "phong": the schedule rooms the unit cools.
//   ip,tang_idx,tang,may_idx,ten,phong
//   192.168.91.13,0,TANG 13,0,E1-12-02 A,E1-12.02
// Several rooms go in one cell separated by spaces, "|" or "+".
export interface AcUnitInput {
  itmIp: string;
  floorName: string;
  unitIndex: number;
  name: string;
  roomCodes: string[];
}

const REQUIRED = ["ip", "tang", "may_idx", "ten"] as const;
const IP_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;

export function parseAcUnitsCsv(text: string): AcUnitInput[] {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Cần dòng tiêu đề và ít nhất một máy.");
  }

  // Excel in Vietnamese locale saves CSV with ";"
  const delimiter = lines[0].includes(",") ? "," : ";";
  const header = splitLine(lines[0], delimiter).map((cell) => cell.toLowerCase());
  const missing = REQUIRED.filter((column) => !header.includes(column));

  if (missing.length > 0) {
    throw new Error(`Thiếu cột: ${missing.join(", ")}.`);
  }

  const col = (cells: string[], name: string) => cells[header.indexOf(name)]?.trim() ?? "";
  const seen = new Set<string>();

  return lines.slice(1).map((line, index) => {
    const lineNumber = index + 2;
    const cells = splitLine(line, delimiter);
    const itmIp = col(cells, "ip");
    const floorName = col(cells, "tang");
    const unitIndex = Number(col(cells, "may_idx"));
    const name = col(cells, "ten");

    if (!IP_PATTERN.test(itmIp)) throw new Error(`Dòng ${lineNumber}: IP "${itmIp}" không hợp lệ.`);
    if (!floorName) throw new Error(`Dòng ${lineNumber}: thiếu tên tầng iTM.`);
    if (!Number.isInteger(unitIndex) || unitIndex < 0) throw new Error(`Dòng ${lineNumber}: may_idx phải là số nguyên ≥ 0.`);
    if (!name) throw new Error(`Dòng ${lineNumber}: thiếu tên máy.`);

    const key = `${itmIp}|${floorName}|${unitIndex}`;
    if (seen.has(key)) throw new Error(`Dòng ${lineNumber}: máy trùng vị trí với một dòng trước.`);
    seen.add(key);

    const roomSeparators = delimiter === "," ? /[\s|+;]+/ : /[\s|+]+/;
    const roomCodes = [
      ...new Set(
        col(cells, "phong")
          .split(roomSeparators)
          .map(normalizeAcRoomCode)
          .filter(Boolean),
      ),
    ];
    const invalid = roomCodes.find((room) => !isBuildingRoom(room));
    if (invalid) throw new Error(`Dòng ${lineNumber}: phòng "${invalid}" không phải mã phòng E1 hợp lệ.`);

    return { itmIp, floorName, unitIndex, name, roomCodes };
  });
}

function splitLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function formatAcUnitsCsv(units: AcUnitInput[]) {
  const quote = (value: string) => (/[",]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

  return [
    "ip,tang,may_idx,ten,phong",
    ...units.map((unit) =>
      [unit.itmIp, unit.floorName, String(unit.unitIndex), unit.name, unit.roomCodes.join(" ")]
        .map(quote)
        .join(","),
    ),
  ].join("\n");
}
