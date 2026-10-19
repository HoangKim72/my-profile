import { z } from "zod";
import {
  isBlankCell,
  normalizeHeaderLabel,
  parseDateKey,
  parseTimeToMinutes,
  toNullableText,
} from "@/tools/mic-filter/processor";
import {
  ACCEPTED_EXCEL_EXTENSIONS,
  MAX_MIC_FILTER_FILE_SIZE,
} from "@/tools/mic-filter/constants";

type SheetCell = string | number | boolean | Date | null | undefined;

const REQUIRED_COLUMNS = {
  roomCode: "Mã phòng",
  studyDate: "Ngày học",
  startTime: "Thời gian bắt đầu",
  endTime: "Thời gian kết thúc",
  note: "Ghi chú",
} as const;

// One schedule line as read from the sheet. Values that fail to parse stay
// null; buildAcPlan decides whether that is fatal (only E1 rows matter).
export const acScheduleRowSchema = z.object({
  rowNumber: z.number().int().min(1),
  roomCode: z.string().max(40),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  startMinutes: z.number().int().min(0).max(1439).nullable(),
  endMinutes: z.number().int().min(0).max(1439).nullable(),
  note: z.string().max(500).nullable(),
});

export type AcScheduleRow = z.infer<typeof acScheduleRowSchema>;

export const acScheduleRowsSchema = z.array(acScheduleRowSchema).min(1).max(2000);

export function normalizeAcRoomCode(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function parseAcScheduleSheet(sheetRows: SheetCell[][]): AcScheduleRow[] {
  const [headerRow, ...dataRows] = sheetRows;

  if (!headerRow || headerRow.length === 0) {
    throw new Error("File Excel đang trống.");
  }

  const columnIndexes = new Map<string, number>();

  headerRow.forEach((cell, index) => {
    const label = normalizeHeaderLabel(cell);

    if (label) {
      columnIndexes.set(label, index);
    }
  });

  const missing = Object.values(REQUIRED_COLUMNS).filter(
    (column) => !columnIndexes.has(normalizeHeaderLabel(column)),
  );

  if (missing.length > 0) {
    throw new Error(`File thiếu cột bắt buộc: ${missing.join(", ")}.`);
  }

  const cell = (row: SheetCell[], column: keyof typeof REQUIRED_COLUMNS) =>
    row[columnIndexes.get(normalizeHeaderLabel(REQUIRED_COLUMNS[column]))!];

  const rows: AcScheduleRow[] = [];

  dataRows.forEach((row, index) => {
    if (row.every((value) => isBlankCell(value))) {
      return;
    }

    rows.push({
      rowNumber: index + 2,
      roomCode: normalizeAcRoomCode(cell(row, "roomCode")),
      dateKey: parseDateKey(cell(row, "studyDate")),
      startMinutes: parseTimeToMinutes(cell(row, "startTime")),
      endMinutes: parseTimeToMinutes(cell(row, "endTime")),
      note: toNullableText(cell(row, "note")),
    });
  });

  if (rows.length === 0) {
    throw new Error("File Excel không có dòng dữ liệu nào.");
  }

  return rows;
}

// Runs in the browser, like the mic tool: the server only receives rows
export async function readAcScheduleFile(file: File) {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  if (!(ACCEPTED_EXCEL_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new Error("Chỉ hỗ trợ file Excel định dạng .xls hoặc .xlsx.");
  }

  if (file.size > MAX_MIC_FILTER_FILE_SIZE) {
    throw new Error("File Excel quá lớn.");
  }

  const { read, utils } = await import("xlsx");
  const workbook = read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });
  const [sheetName] = workbook.SheetNames;

  if (!sheetName) {
    throw new Error("File Excel không có sheet nào để xử lý.");
  }

  const sheetRows = utils.sheet_to_json<SheetCell[]>(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: null,
  });

  return { fileName: file.name, rows: parseAcScheduleSheet(sheetRows) };
}
