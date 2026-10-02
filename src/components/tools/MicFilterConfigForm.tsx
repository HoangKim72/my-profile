"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  resetMicFilterConfig,
  saveMicFilterConfig,
} from "@/actions/tools";
import {
  DEFAULT_MIC_FILTER_CONFIG,
  describeAlarmRule,
  formatClockValue,
  micFilterConfigSchema,
  normalizeRoomList,
  parseClockValue,
  ROOM_CODE_PATTERN,
  SHIFT_LABELS,
  type MicFilterAlarmRule,
  type MicFilterConfig,
  type ShiftKey,
} from "@/tools/mic-filter/config";

const SHIFT_KEYS: ShiftKey[] = ["morning", "afternoon", "evening"];

const RULE_FIELDS = [
  ["matchFromMinutes", "Lớp bắt đầu từ"],
  ["matchToMinutes", "đến"],
  ["alarmMinutes", "Chuông lúc"],
  ["promptFromMinutes", "Hiện gợi ý từ"],
  ["promptToMinutes", "đến"],
] as const;

type RuleField = (typeof RULE_FIELDS)[number][0];

interface RuleDraft extends Record<RuleField, string> {
  id: string;
}

interface FormDraft {
  roomsText: string;
  shifts: Record<ShiftKey, { start: string; end: string }>;
  rules: RuleDraft[];
}

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

const SECTION_CLASS =
  "rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85 md:p-7";

export function MicFilterConfigForm({
  initialConfig,
  isUsingDefaults,
}: {
  initialConfig: MicFilterConfig;
  isUsingDefaults: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<FormDraft>(() => toDraft(initialConfig));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const rooms = parseRooms(draft.roomsText);
  const invalidRooms = rooms.filter((room) => !ROOM_CODE_PATTERN.test(room));
  const floorCount = new Set(
    rooms
      .filter((room) => ROOM_CODE_PATTERN.test(room))
      .map((room) => room.slice(0, room.indexOf("."))),
  ).size;

  const updateDraft = (update: (current: FormDraft) => FormDraft) => {
    setDraft(update);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const built = fromDraft(draft);

    if ("error" in built) {
      setError(built.error);
      return;
    }

    const parsed = micFilterConfigSchema.safeParse(built.config);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Cấu hình không hợp lệ.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveMicFilterConfig(parsed.data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setDraft(toDraft(parsed.data));
      setNotice("Đã lưu. Tool lọc mic dùng cấu hình mới từ lần tải trang tiếp theo.");
      router.refresh();
    } catch {
      setError("Không lưu được cấu hình lúc này.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Xoá cấu hình đã lưu và quay về cấu hình mặc định trong code?",
      )
    ) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await resetMicFilterConfig();

      if (!result.success) {
        setError(result.error);
        return;
      }

      setDraft(toDraft(DEFAULT_MIC_FILTER_CONFIG));
      setError(null);
      setNotice("Đã quay về cấu hình mặc định.");
      router.refresh();
    } catch {
      setError("Không khôi phục được cấu hình lúc này.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-2xl bg-red-100 p-4 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-100">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl bg-emerald-100 p-4 text-sm text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100">
          {notice}
        </div>
      )}

      <section className={SECTION_CLASS}>
        <h3 className="text-xl font-bold text-slate-950 dark:text-white">
          Phòng có mic không dây
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Mỗi dòng một mã phòng dạng <code>E1-05.07</code>. Dấu phẩy và khoảng
          trắng cũng được chấp nhận. Mã trùng sẽ tự bỏ.
        </p>
        <textarea
          value={draft.roomsText}
          onChange={(event) =>
            updateDraft((current) => ({
              ...current,
              roomsText: event.target.value,
            }))
          }
          rows={12}
          spellCheck={false}
          className={`${INPUT_CLASS} mt-4 font-mono`}
        />
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {rooms.length} phòng trên {floorCount} tầng.
        </p>
        {invalidRooms.length > 0 && (
          <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-300">
            Mã không đúng định dạng: {invalidRooms.slice(0, 10).join(", ")}
            {invalidRooms.length > 10 ? "…" : ""}
          </p>
        )}
      </section>

      <section className={SECTION_CLASS}>
        <h3 className="text-xl font-bold text-slate-950 dark:text-white">
          Khung giờ ca
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Một lớp được tính vào ca nếu thời gian học chồng lên khung giờ này.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {SHIFT_KEYS.map((key) => (
            <fieldset
              key={key}
              className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <legend className="px-1 text-sm font-semibold text-slate-900 dark:text-white">
                {SHIFT_LABELS[key]}
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {(["start", "end"] as const).map((edge) => (
                  <label key={edge} className="text-xs text-slate-500">
                    {edge === "start" ? "Bắt đầu" : "Kết thúc"}
                    <input
                      type="time"
                      value={draft.shifts[key][edge]}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          shifts: {
                            ...current.shifts,
                            [key]: {
                              ...current.shifts[key],
                              [edge]: event.target.value,
                            },
                          },
                        }))
                      }
                      className={`${INPUT_CLASS} mt-1`}
                      required
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-950 dark:text-white">
              Rule nhắc bật máy lạnh
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Nếu file có lớp bắt đầu trong khung giờ của rule, tool sẽ gợi ý
              đặt chuông. Gợi ý chỉ hiện trong khung &quot;Hiện gợi ý&quot;.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateDraft((current) => ({
                ...current,
                rules: [...current.rules, createRuleDraft()],
              }))
            }
            className="btn-secondary"
          >
            <Plus size={16} />
            Thêm rule
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {draft.rules.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
              Chưa có rule nào, tool sẽ không gợi ý đặt chuông.
            </p>
          )}
          {draft.rules.map((rule, index) => {
            const preview = previewRule(rule);

            return (
              <div
                key={rule.id}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {RULE_FIELDS.map(([field, label]) => (
                    <label key={field} className="text-xs text-slate-500">
                      {label}
                      <input
                        type="time"
                        value={rule[field]}
                        onChange={(event) =>
                          updateDraft((current) => ({
                            ...current,
                            rules: current.rules.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, [field]: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className={`${INPUT_CLASS} mt-1`}
                        required
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {preview ?? "Nhập đủ giờ để xem trước câu gợi ý."}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((current) => ({
                        ...current,
                        rules: current.rules.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-300"
                  >
                    <Trash2 size={15} />
                    Xoá rule
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={isSaving} className="btn-primary">
          {isSaving ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Lưu cấu hình
        </button>
        {!isUsingDefaults && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleReset()}
            className="btn-secondary"
          >
            <RotateCcw size={16} />
            Về mặc định
          </button>
        )}
      </div>
    </form>
  );
}

function parseRooms(text: string) {
  return normalizeRoomList(text.split(/[\s,;]+/));
}

function toDraft(config: MicFilterConfig): FormDraft {
  return {
    roomsText: config.wirelessRooms.join("\n"),
    shifts: Object.fromEntries(
      SHIFT_KEYS.map((key) => [
        key,
        {
          start: formatClockValue(config.shifts[key].startMinutes),
          end: formatClockValue(config.shifts[key].endMinutes),
        },
      ]),
    ) as FormDraft["shifts"],
    rules: config.alarmRules.map((rule) => ({
      id: rule.id,
      matchFromMinutes: formatClockValue(rule.matchFromMinutes),
      matchToMinutes: formatClockValue(rule.matchToMinutes),
      alarmMinutes: formatClockValue(rule.alarmMinutes),
      promptFromMinutes: formatClockValue(rule.promptFromMinutes),
      promptToMinutes: formatClockValue(rule.promptToMinutes),
    })),
  };
}

function createRuleDraft(): RuleDraft {
  return {
    id: `rule-${Date.now().toString(36)}`,
    matchFromMinutes: "",
    matchToMinutes: "",
    alarmMinutes: "",
    promptFromMinutes: "",
    promptToMinutes: "",
  };
}

function parseRule(rule: RuleDraft): MicFilterAlarmRule | null {
  const values = RULE_FIELDS.map(([field]) => parseClockValue(rule[field]));

  if (values.some((value) => value === null)) {
    return null;
  }

  const [matchFrom, matchTo, alarm, promptFrom, promptTo] = values as number[];

  return {
    id: rule.id,
    matchFromMinutes: matchFrom,
    matchToMinutes: matchTo,
    alarmMinutes: alarm,
    promptFromMinutes: promptFrom,
    promptToMinutes: promptTo,
  };
}

function previewRule(rule: RuleDraft) {
  const parsed = parseRule(rule);

  return parsed ? describeAlarmRule(parsed).promptMessage : null;
}

function fromDraft(
  draft: FormDraft,
): { config: MicFilterConfig } | { error: string } {
  const shifts = {} as MicFilterConfig["shifts"];

  for (const key of SHIFT_KEYS) {
    const start = parseClockValue(draft.shifts[key].start);
    const end = parseClockValue(draft.shifts[key].end);

    if (start === null || end === null) {
      return { error: `Giờ của ${SHIFT_LABELS[key].toLowerCase()} chưa hợp lệ.` };
    }

    shifts[key] = { startMinutes: start, endMinutes: end };
  }

  const alarmRules: MicFilterAlarmRule[] = [];

  for (const [index, rule] of draft.rules.entries()) {
    const parsed = parseRule(rule);

    if (!parsed) {
      return { error: `Rule nhắc thứ ${index + 1} còn thiếu giờ.` };
    }

    alarmRules.push(parsed);
  }

  return {
    config: {
      version: 1,
      wirelessRooms: parseRooms(draft.roomsText),
      shifts,
      alarmRules,
    },
  };
}
