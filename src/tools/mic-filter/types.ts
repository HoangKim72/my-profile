export interface ParsedMicScheduleRow {
  rowNumber: number;
  roomCode: string;
  roomNumber: string;
  roomDisplay: string;
  studyDateKey: string | null;
  studyDateLabel: string | null;
  startMinutes: number;
  endMinutes: number;
  note: string | null;
  isCancelled: boolean;
  building: string;
  floor: string;
  usesMorning: boolean;
  usesAfternoon: boolean;
  usesEvening: boolean;
}

export interface MorningFloorRow {
  floor: string;
  rooms: string[];
}

export interface MiddayActionRow {
  floor: string;
  collectRooms: string[];
  distributeRooms: string[];
  replaceBatteryRooms: string[];
}

export interface SpecialAlarmCandidate {
  id: string;
  classStartMinutes: number;
  classStartLabel: string;
  alarmMinutes: number;
  alarmLabel: string;
  promptMessage: string;
  promptWindowStartMinutes: number;
  promptWindowEndMinutes: number;
  matchedScheduleCount: number;
  matchedRooms: string[];
}

export interface MicFilterReport {
  fileName: string;
  sheetName: string;
  hasStudyDateColumn: boolean;
  studyDateKey: string | null;
  studyDateLabel: string | null;
  totalScheduleCount: number;
  wirelessScheduleCount: number;
  ignoredScheduleCount: number;
  uniqueWirelessRoomCount: number;
  morningRoomCount: number;
  middayActionCount: number;
  morningRows: MorningFloorRow[];
  middayRows: MiddayActionRow[];
  specialAlarmCandidates: SpecialAlarmCandidate[];
}
