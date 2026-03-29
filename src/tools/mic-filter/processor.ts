import {
  ACCEPTED_EXCEL_EXTENSIONS,
  ACCEPTED_EXCEL_FILE_TYPES,
  ENFORCE_TOMORROW_STUDY_DATE,
  MAX_MIC_FILTER_FILE_SIZE,
  REQUIRED_MIC_FILTER_COLUMNS,
  SHIFT_WINDOWS,
  WIRELESS_MIC_ROOMS,
} from "@/tools/mic-filter/constants";
import { buildSpecialAlarmCandidates } from "@/tools/mic-filter/alarm";
import type {
  MicFilterReport,
  MiddayActionRow,
  ParsedMicScheduleRow,
} from "@/tools/mic-filter/types";

type SheetCell = string | number | boolean | Date | null | undefined;

const ACCEPTED_EXCEL_FILE_TYPE_SET = new Set<string>(ACCEPTED_EXCEL_FILE_TYPES);
const ACCEPTED_EXCEL_EXTENSION_SET = new Set<string>(ACCEPTED_EXCEL_EXTENSIONS);
const WIRELESS_MIC_ROOM_SET = new Set<string>(WIRELESS_MIC_ROOMS);
const CANCELLED_NOTE_KEYWORD = "da bao nghi";
const REQUIRED_COLUMN_KEYS = {
  roomCode: normalizeHeaderLabel("Mã phòng"),
  studyDate: normalizeHeaderLabel("Ngày học"),
  startTime: normalizeHeaderLabel("Thời gian bắt đầu"),
  endTime: normalizeHeaderLabel("Thời gian kết thúc"),
  note: normalizeHeaderLabel("Ghi chú"),
} as const;

export async function processMicFilterFile(
  file: File,
  now = new Date(),
): Promise<MicFilterReport> {
  validateExcelFile(file);

  const { read, utils } = await import("xlsx");
  const workbook = read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });

  const [sheetName] = workbook.SheetNames;

  if (!sheetName) {
    throw new Error("File Excel không có sheet nào để xử lý.");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = utils.sheet_to_json<SheetCell[]>(worksheet, {
    header: 1,
    raw: false,
    defval: null,
  });

  const parsedRows = parseWorksheetRows(rows);

  return buildMicFilterReport(parsedRows, {
    fileName: file.name,
    now,
    sheetName,
  });
}

function validateExcelFile(file: File) {
  const fileExtension = getFileExtension(file.name);
  const isSupportedMimeType =
    file.type.length === 0 || ACCEPTED_EXCEL_FILE_TYPE_SET.has(file.type);

  if (!ACCEPTED_EXCEL_EXTENSION_SET.has(fileExtension) && !isSupportedMimeType) {
    throw new Error("Chỉ hỗ trợ file Excel định dạng .xls hoặc .xlsx.");
  }

  if (file.size > MAX_MIC_FILTER_FILE_SIZE) {
    throw new Error(
      `Kích thước file tối đa là ${Math.round(
        MAX_MIC_FILTER_FILE_SIZE / 1024 / 1024,
      )}MB.`,
    );
  }
}

function parseWorksheetRows(sheetRows: SheetCell[][]): ParsedMicScheduleRow[] {
  const [headerRow, ...dataRows] = sheetRows;

  if (!headerRow || headerRow.length === 0) {
    throw new Error("File Excel đang trống.");
  }

  const columnIndexes = new Map<string, number>();

  headerRow.forEach((headerCell, index) => {
    const normalizedHeader = normalizeHeaderLabel(headerCell);

    if (normalizedHeader) {
      columnIndexes.set(normalizedHeader, index);
    }
  });

  const missingColumns = REQUIRED_MIC_FILTER_COLUMNS.filter((column) => {
    return !columnIndexes.has(normalizeHeaderLabel(column));
  });

  if (missingColumns.length > 0) {
    throw new Error(`File thiếu cột bắt buộc: ${missingColumns.join(", ")}.`);
  }

  const hasStudyDateColumn = columnIndexes.has(REQUIRED_COLUMN_KEYS.studyDate);
  const parsedRows = dataRows
    .map((row, index) =>
      parseDataRow(row, index + 2, columnIndexes, hasStudyDateColumn),
    )
    .filter((row): row is ParsedMicScheduleRow => row !== null);

  if (parsedRows.length === 0) {
    throw new Error("File Excel không có dòng dữ liệu nào để xử lý.");
  }

  return parsedRows;
}

function parseDataRow(
  row: SheetCell[],
  rowNumber: number,
  columnIndexes: Map<string, number>,
  hasStudyDateColumn: boolean,
): ParsedMicScheduleRow | null {
  if (row.every((cell) => isBlankCell(cell))) {
    return null;
  }

  const roomCode = normalizeRoomCode(
    getCellValue(row, columnIndexes, REQUIRED_COLUMN_KEYS.roomCode),
  );
  const startTimeValue = getCellValue(
    row,
    columnIndexes,
    REQUIRED_COLUMN_KEYS.startTime,
  );
  const endTimeValue = getCellValue(
    row,
    columnIndexes,
    REQUIRED_COLUMN_KEYS.endTime,
  );
  const note = toNullableText(
    getCellValue(row, columnIndexes, REQUIRED_COLUMN_KEYS.note),
  );
  const isCancelled = isCancelledScheduleNote(note);

  if (!roomCode) {
    throw new Error(`Dòng ${rowNumber} đang thiếu Mã phòng.`);
  }

  const studyDateValue = hasStudyDateColumn
    ? getCellValue(row, columnIndexes, REQUIRED_COLUMN_KEYS.studyDate)
    : null;
  const studyDateKey = hasStudyDateColumn ? parseDateKey(studyDateValue) : null;

  if (hasStudyDateColumn && !studyDateKey) {
    throw new Error(`Không đọc được Ngày học ở dòng ${rowNumber}.`);
  }

  const startMinutes = parseTimeToMinutes(startTimeValue);
  const endMinutes = parseTimeToMinutes(endTimeValue);

  if (startMinutes === null || endMinutes === null) {
    throw new Error(`Không đọc được thời gian ở dòng ${rowNumber}.`);
  }

  if (startMinutes >= endMinutes) {
    throw new Error(
      `Thời gian bắt đầu/kết thúc không hợp lệ ở dòng ${rowNumber}.`,
    );
  }

  const roomMeta = extractRoomMetadata(roomCode);

  return {
    rowNumber,
    roomCode,
    roomNumber: roomMeta.roomNumber,
    roomDisplay: roomMeta.roomDisplay,
    studyDateKey,
    studyDateLabel: studyDateKey ? formatDateKey(studyDateKey) : null,
    startMinutes,
    endMinutes,
    note,
    isCancelled,
    building: roomMeta.building,
    floor: roomMeta.floor,
    usesMorning: overlapsShift(
      startMinutes,
      endMinutes,
      SHIFT_WINDOWS.morning.startMinutes,
      SHIFT_WINDOWS.morning.endMinutes,
    ),
    usesAfternoon: overlapsShift(
      startMinutes,
      endMinutes,
      SHIFT_WINDOWS.afternoon.startMinutes,
      SHIFT_WINDOWS.afternoon.endMinutes,
    ),
    usesEvening: overlapsShift(
      startMinutes,
      endMinutes,
      SHIFT_WINDOWS.evening.startMinutes,
      SHIFT_WINDOWS.evening.endMinutes,
    ),
  };
}

function buildMicFilterReport(
  rows: ParsedMicScheduleRow[],
  options: {
    fileName: string;
    now: Date;
    sheetName: string;
  },
): MicFilterReport {
  const tomorrowKey = getTomorrowDateKey(options.now);
  const fileDateKeys = new Set(
    rows
      .map((row) => row.studyDateKey)
      .filter((studyDateKey): studyDateKey is string => Boolean(studyDateKey)),
  );
  const hasStudyDateColumn = rows.some((row) => row.studyDateKey !== null);

  if (
    hasStudyDateColumn &&
    ENFORCE_TOMORROW_STUDY_DATE &&
    (fileDateKeys.size !== 1 || !fileDateKeys.has(tomorrowKey))
  ) {
    throw new Error("Ngày học không phải ngày mai, bạn có tải lên đúng file?");
  }

  const resolvedStudyDateKey =
    hasStudyDateColumn && fileDateKeys.size === 1 ? [...fileDateKeys][0] : null;
  const specialAlarmCandidates = buildSpecialAlarmCandidates(
    rows.filter((row) => !row.isCancelled),
  );

  const wirelessRows = rows.filter((row) => WIRELESS_MIC_ROOM_SET.has(row.roomCode));
  const roomSummary = new Map<
    string,
    {
      roomCode: string;
      roomNumber: string;
      roomDisplay: string;
      floor: string;
      building: string;
      usesMorning: boolean;
      usesAfternoon: boolean;
      usesEvening: boolean;
    }
  >();

  wirelessRows.forEach((row) => {
    const existing = roomSummary.get(row.roomCode);
    const isActionableRow = !row.isCancelled;

    if (existing) {
      existing.usesMorning ||= isActionableRow && row.usesMorning;
      existing.usesAfternoon ||= isActionableRow && row.usesAfternoon;
      existing.usesEvening ||= isActionableRow && row.usesEvening;
      return;
    }

    roomSummary.set(row.roomCode, {
      roomCode: row.roomCode,
      roomNumber: row.roomNumber,
      roomDisplay: row.roomDisplay,
      floor: row.floor,
      building: row.building,
      usesMorning: isActionableRow && row.usesMorning,
      usesAfternoon: isActionableRow && row.usesAfternoon,
      usesEvening: isActionableRow && row.usesEvening,
    });
  });

  const rooms = [...roomSummary.values()].sort(compareRooms);

  const morningGroups = new Map<string, string[]>();

  rooms
    .filter((room) => room.usesMorning)
    .forEach((room) => {
      const groupedRooms = morningGroups.get(room.floor) ?? [];

      groupedRooms.push(room.roomDisplay);
      morningGroups.set(room.floor, groupedRooms);
    });

  const morningRows = [...morningGroups.entries()]
    .map(([floor, groupedRooms]) => ({
      floor,
      rooms: sortRoomDisplays(groupedRooms),
    }))
    .sort((left, right) => Number(left.floor) - Number(right.floor));
  const morningRoomCount = rooms.filter((room) => room.usesMorning).length;

  const middayGroups = new Map<string, MiddayActionRow>();

  rooms.forEach((room) => {
    let targetKey: keyof Omit<MiddayActionRow, "floor"> | null = null;

    if (room.usesMorning && room.usesAfternoon) {
      targetKey = "replaceBatteryRooms";
    } else if (room.usesMorning && !room.usesAfternoon) {
      targetKey = "collectRooms";
    } else if (!room.usesMorning && room.usesAfternoon) {
      targetKey = "distributeRooms";
    }

    if (!targetKey) {
      return;
    }

    const row = middayGroups.get(room.floor) ?? {
      floor: room.floor,
      collectRooms: [],
      distributeRooms: [],
      replaceBatteryRooms: [],
    };

    row[targetKey].push(room.roomDisplay);
    middayGroups.set(room.floor, row);
  });

  const middayRows = [...middayGroups.values()].sort(compareFloors);

  middayRows.forEach((row) => {
    row.collectRooms.sort(compareRoomCodes);
    row.distributeRooms.sort(compareRoomCodes);
    row.replaceBatteryRooms.sort(compareRoomCodes);
  });

  return {
    fileName: options.fileName,
    sheetName: options.sheetName,
    hasStudyDateColumn,
    studyDateKey: resolvedStudyDateKey,
    studyDateLabel: resolvedStudyDateKey
      ? formatDateKey(resolvedStudyDateKey)
      : null,
    totalScheduleCount: rows.length,
    wirelessScheduleCount: wirelessRows.length,
    ignoredScheduleCount: rows.length - wirelessRows.length,
    uniqueWirelessRoomCount: rooms.length,
    morningRoomCount,
    middayActionCount: middayRows.reduce((count, row) => {
      return (
        count +
        row.collectRooms.length +
        row.distributeRooms.length +
        row.replaceBatteryRooms.length
      );
    }, 0),
    morningRows,
    middayRows,
    specialAlarmCandidates,
  };
}

function normalizeHeaderLabel(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi-VN");
}

function getCellValue(
  row: SheetCell[],
  columnIndexes: Map<string, number>,
  columnKey: string,
) {
  const index = columnIndexes.get(columnKey);

  return index === undefined ? null : row[index];
}

function isBlankCell(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

function toNullableText(value: unknown) {
  const text = String(value ?? "").trim();

  return text.length === 0 ? null : text;
}

function normalizeSearchableText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("vi-VN");
}

function isCancelledScheduleNote(note: string | null) {
  return normalizeSearchableText(note).includes(CANCELLED_NOTE_KEYWORD);
}

function normalizeRoomCode(value: unknown) {
  const roomCode = toNullableText(value);

  return roomCode?.toUpperCase() ?? null;
}

function parseDateKey(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toDateKey(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const excelDate = excelSerialNumberToDate(value);

    return excelDate ? toDateKey(excelDate) : null;
  }

  const text = toNullableText(value);

  if (!text) {
    return null;
  }

  const datePart = text.split(" ")[0];
  const normalizedDatePart = datePart.replace(/\./g, "/").replace(/-/g, "/");
  const dateMatch =
    /^(\d{1,4})\/(\d{1,2})\/(\d{1,4})$/.exec(normalizedDatePart);

  if (dateMatch) {
    const first = Number(dateMatch[1]);
    const second = Number(dateMatch[2]);
    const third = Number(dateMatch[3]);

    if (dateMatch[1].length === 4) {
      return createDateKey(first, second, third);
    }

    return createDateKey(third, second, first);
  }

  const fallback = new Date(text);

  if (!Number.isNaN(fallback.getTime())) {
    return toDateKey(fallback);
  }

  return null;
}

function parseTimeToMinutes(value: unknown): number | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getHours() * 60 + value.getMinutes();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 0 && value < 1) {
      return Math.round(value * 24 * 60);
    }

    const excelDate = excelSerialNumberToDate(value);

    if (excelDate) {
      return excelDate.getHours() * 60 + excelDate.getMinutes();
    }
  }

  const text = toNullableText(value);

  if (!text) {
    return null;
  }

  const timeMatch = /(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(text);

  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);

    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  const numericValue = Number(text.replace(",", "."));

  if (Number.isFinite(numericValue) && numericValue >= 0 && numericValue < 1) {
    return Math.round(numericValue * 24 * 60);
  }

  return null;
}

function excelSerialNumberToDate(serialNumber: number) {
  if (serialNumber <= 0) {
    return null;
  }

  const excelEpoch = Date.UTC(1899, 11, 30);
  const milliseconds = Math.round(serialNumber * 24 * 60 * 60 * 1000);

  return new Date(excelEpoch + milliseconds);
}

function overlapsShift(
  startMinutes: number,
  endMinutes: number,
  shiftStart: number,
  shiftEnd: number,
) {
  return startMinutes < shiftEnd && endMinutes > shiftStart;
}

function extractRoomMetadata(roomCode: string) {
  const match = /^([A-Z0-9]+)-(\d{2})\.(\d{2})$/.exec(roomCode);

  if (!match) {
    return {
      building: "N/A",
      floor: "??",
      roomNumber: "??",
      roomDisplay: roomCode,
    };
  }

  return {
    building: match[1],
    floor: match[2],
    roomNumber: match[3],
    roomDisplay: String(Number(match[3])),
  };
}

function compareRooms(
  left: {
    building: string;
    floor: string;
    roomCode: string;
  },
  right: {
    building: string;
    floor: string;
    roomCode: string;
  },
) {
  if (left.building !== right.building) {
    return left.building.localeCompare(right.building);
  }

  if (left.floor !== right.floor) {
    return Number(left.floor) - Number(right.floor);
  }

  return compareRoomCodes(left.roomCode, right.roomCode);
}

function compareFloors(left: MiddayActionRow, right: MiddayActionRow) {
  return Number(left.floor) - Number(right.floor);
}

function compareRoomCodes(left: string, right: string) {
  return left.localeCompare(right, "vi-VN", {
    numeric: true,
  });
}

function sortRoomDisplays(rooms: string[]) {
  return [...new Set(rooms)].sort(compareRoomCodes);
}

function getTomorrowDateKey(now: Date) {
  const tomorrow = new Date(now);

  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return toDateKey(tomorrow);
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function createDateKey(year: number, month: number, day: number) {
  if (year < 100) {
    year += 2000;
  }

  const candidate = new Date(year, month - 1, day);

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return toDateKey(candidate);
}

function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  return `${day}/${month}/${year}`;
}

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");

  return index === -1 ? "" : fileName.slice(index).toLowerCase();
}
