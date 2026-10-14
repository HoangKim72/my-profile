"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  Textarea,
  fieldDescribedBy,
} from "@/components/ui";
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
  ["matchToMinutes", "Lớp bắt đầu đến"],
  ["alarmMinutes", "Chuông lúc"],
  ["promptFromMinutes", "Hiện gợi ý từ"],
  ["promptToMinutes", "Hiện gợi ý đến"],
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

  const roomsHint = `${rooms.length} phòng trên ${floorCount} tầng.`;
  const roomsError =
    invalidRooms.length > 0
      ? `Mã không đúng định dạng: ${invalidRooms.slice(0, 10).join(", ")}${
          invalidRooms.length > 10 ? "…" : ""
        }`
      : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card as="section" aria-labelledby="mic-rooms-heading">
        <h2 id="mic-rooms-heading" className="text-lg font-semibold text-ink">
          Phòng có mic không dây
        </h2>
        <p className="mt-1 text-sm text-muted">
          Mỗi dòng một mã phòng dạng <code className="font-mono">E1-05.07</code>.
          Dấu phẩy và khoảng trắng cũng được chấp nhận. Mã trùng sẽ tự bỏ.
        </p>
        <Field
          htmlFor="mic-rooms"
          label="Danh sách mã phòng"
          hint={roomsHint}
          error={roomsError}
          className="mt-4"
        >
          <Textarea
            id="mic-rooms"
            value={draft.roomsText}
            onChange={(event) =>
              updateDraft((current) => ({
                ...current,
                roomsText: event.target.value,
              }))
            }
            rows={12}
            spellCheck={false}
            className="font-mono text-sm"
            invalid={Boolean(roomsError)}
            aria-describedby={fieldDescribedBy("mic-rooms", {
              hint: roomsHint,
              error: roomsError,
            })}
          />
        </Field>
      </Card>

      <Card as="section" aria-labelledby="mic-shifts-heading">
        <h2 id="mic-shifts-heading" className="text-lg font-semibold text-ink">
          Khung giờ ca
        </h2>
        <p className="mt-1 text-sm text-muted">
          Một lớp được tính vào ca nếu thời gian học chồng lên khung giờ này.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {SHIFT_KEYS.map((key) => (
            <fieldset
              key={key}
              className="min-w-0 rounded-lg border border-line p-4"
            >
              <legend className="px-1 text-sm font-semibold text-ink">
                {SHIFT_LABELS[key]}
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {(["start", "end"] as const).map((edge) => (
                  <Field
                    key={edge}
                    htmlFor={`mic-shift-${key}-${edge}`}
                    label={edge === "start" ? "Bắt đầu" : "Kết thúc"}
                  >
                    <Input
                      id={`mic-shift-${key}-${edge}`}
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
                      className="px-2 font-mono tabular-nums"
                      required
                    />
                  </Field>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Card>

      <Card as="section" aria-labelledby="mic-rules-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="mic-rules-heading"
              className="text-lg font-semibold text-ink"
            >
              Quy tắc nhắc bật máy lạnh
            </h2>
            <p className="mt-1 text-sm text-muted">
              Nếu file có lớp bắt đầu trong khung giờ của quy tắc, tool sẽ gợi ý
              đặt chuông. Gợi ý chỉ hiện trong khung &quot;Hiện gợi ý&quot;.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus size={16} aria-hidden="true" />}
            onClick={() =>
              updateDraft((current) => ({
                ...current,
                rules: [...current.rules, createRuleDraft()],
              }))
            }
          >
            Thêm quy tắc
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {draft.rules.length === 0 && (
            <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted">
              Chưa có quy tắc nào, tool sẽ không gợi ý đặt chuông.
            </p>
          )}
          {draft.rules.map((rule, index) => {
            const preview = previewRule(rule);
            const previewId = `mic-rule-${rule.id}-preview`;

            return (
              <fieldset
                key={rule.id}
                className="min-w-0 rounded-lg border border-line p-4"
                aria-describedby={previewId}
              >
                <legend className="px-1 text-sm font-semibold text-ink">
                  Quy tắc {index + 1}
                </legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {RULE_FIELDS.map(([field, label]) => (
                    <Field
                      key={field}
                      htmlFor={`mic-rule-${rule.id}-${field}`}
                      label={label}
                    >
                      <Input
                        id={`mic-rule-${rule.id}-${field}`}
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
                        className="px-2 font-mono tabular-nums"
                        required
                      />
                    </Field>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p id={previewId} className="min-w-0 text-sm text-muted">
                    {preview ?? "Nhập đủ giờ để xem trước câu gợi ý."}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    leftIcon={<Trash2 size={16} aria-hidden="true" />}
                    onClick={() =>
                      updateDraft((current) => ({
                        ...current,
                        rules: current.rules.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                  >
                    Xoá quy tắc {index + 1}
                  </Button>
                </div>
              </fieldset>
            );
          })}
        </div>
      </Card>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-success/30 bg-success-soft p-4 text-sm text-success"
        >
          <CheckCircle2
            size={16}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          {notice}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          loading={isSaving}
          leftIcon={<Save size={16} aria-hidden="true" />}
        >
          Lưu cấu hình
        </Button>
        {!isUsingDefaults && (
          <Button
            variant="secondary"
            disabled={isSaving}
            onClick={() => void handleReset()}
            leftIcon={<RotateCcw size={16} aria-hidden="true" />}
          >
            Về mặc định
          </Button>
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
      return { error: `Quy tắc nhắc thứ ${index + 1} còn thiếu giờ.` };
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
