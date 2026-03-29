export const REQUIRED_MIC_FILTER_COLUMNS = [
  "Mã phòng",
  "Thời gian bắt đầu",
  "Thời gian kết thúc",
  "Ghi chú",
] as const;

export const ACCEPTED_EXCEL_FILE_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const ACCEPTED_EXCEL_EXTENSIONS = [".xls", ".xlsx"] as const;

export const MAX_MIC_FILTER_FILE_SIZE =
  Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 10 * 1024 * 1024;

export const ENFORCE_TOMORROW_STUDY_DATE = true;

export const SHIFT_WINDOWS = {
  morning: {
    label: "Ca sáng",
    startMinutes: 7 * 60 + 30,
    endMinutes: 11 * 60 + 35,
  },
  afternoon: {
    label: "Ca chiều",
    startMinutes: 12 * 60 + 30,
    endMinutes: 16 * 60 + 35,
  },
  evening: {
    label: "Ca tối",
    startMinutes: 18 * 60,
    endMinutes: 20 * 60 + 15,
  },
} as const;

export const WIRELESS_MIC_ROOMS = [
  "E1-03.05",
  "E1-03.07",
  "E1-03.10",
  "E1-03.18",
  "E1-05.05",
  "E1-05.07",
  "E1-05.08",
  "E1-05.10",
  "E1-05.12",
  "E1-06.05",
  "E1-06.07",
  "E1-06.08",
  "E1-06.10",
  "E1-06.12",
  "E1-07.01",
  "E1-07.03",
  "E1-07.05",
  "E1-07.08",
  "E1-07.10",
  "E1-07.12",
  "E1-08.05",
  "E1-08.07",
  "E1-08.08",
  "E1-08.10",
  "E1-08.12",
  "E1-09.05",
  "E1-09.07",
  "E1-09.08",
  "E1-09.10",
  "E1-09.12",
  "E1-11.01",
  "E1-11.03",
  "E1-11.04",
  "E1-11.05",
  "E1-11.06",
  "E1-11.07",
  "E1-11.08",
  "E1-11.09",
  "E1-11.10",
  "E1-11.12",
] as const;
