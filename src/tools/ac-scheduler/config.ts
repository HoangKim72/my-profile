import { z } from "zod";

// Runtime-editable settings for the air-conditioner scheduler. Stored in
// `tool_settings` under AC_SCHEDULER_SETTINGS_KEY. The LAN agent reads the
// same values through /api/ac-agent/plan.

export const AC_SCHEDULER_SETTINGS_KEY = "ac-scheduler";

// Only rooms of this building are ever scheduled
export const AC_BUILDING = "E1";

// Role name that lets a non-admin import and activate schedules
export const AC_OPERATOR_ROLE = "ac_operator";

export const AC_TIME_ZONE = "Asia/Ho_Chi_Minh";
// Vietnam has no daylight saving time
export const AC_UTC_OFFSET_MINUTES = 7 * 60;

// Classes outside this range are treated as data errors
export const AC_EARLIEST_START_MINUTES = 6 * 60;
export const AC_LATEST_END_MINUTES = 22 * 60;

export const acSchedulerConfigSchema = z
  .object({
    version: z.literal(1),
    // Turn units on this many minutes before class to pre-cool the room
    leadMinutes: z.number().int().min(0).max(60),
    // Late turn-on is skipped when less than this is left before class ends
    minRemainingMinutes: z.number().int().min(0).max(120),
    // More units than this turning on at once needs an extra confirmation
    maxConcurrentUnits: z.number().int().min(1).max(500),
    // Kill switch: the agent sends no command while paused
    paused: z.boolean(),
    // The agent only logs what it would do
    dryRun: z.boolean(),
  })
  .strict();

export type AcSchedulerConfig = z.infer<typeof acSchedulerConfigSchema>;

// dryRun starts on so the first real run is a deliberate admin decision
export const DEFAULT_AC_SCHEDULER_CONFIG: AcSchedulerConfig = {
  version: 1,
  leadMinutes: 20,
  minRemainingMinutes: 30,
  maxConcurrentUnits: 30,
  paused: false,
  dryRun: true,
};
