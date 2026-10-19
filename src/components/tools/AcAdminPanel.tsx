"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Save, Trash2 } from "lucide-react";
import { Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";
import {
  createAcAgent,
  revokeAcAgent,
  saveAcSchedulerConfig,
  saveAcUnits,
  setAcOperator,
} from "@/actions/ac";
import type { AcSchedulerConfig } from "@/tools/ac-scheduler/config";
import { formatAcClock } from "@/tools/ac-scheduler/view";

interface AcAdminPanelProps {
  config: AcSchedulerConfig;
  unitsCsv: string;
  unitCount: number;
  users: Array<{ id: string; email: string; isAdmin: boolean; isOperator: boolean }>;
  agents: Array<{ id: string; name: string; lastSeenAt: string | null; lastIp: string | null }>;
}

type Feedback = { tone: "ok" | "error"; text: string } | null;

export function AcAdminPanel({ config, unitsCsv, unitCount, users, agents }: AcAdminPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [csv, setCsv] = useState(unitsCsv);
  const [agentName, setAgentName] = useState("PC trực E1");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    leadMinutes: String(config.leadMinutes),
    minRemainingMinutes: String(config.minRemainingMinutes),
    maxConcurrentUnits: String(config.maxConcurrentUnits),
    dryRun: config.dryRun,
  });

  function run(section: string, action: () => Promise<{ success: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      setFeedback((current) => ({
        ...current,
        [section]: result.success
          ? { tone: "ok", text: result.message ?? "Đã lưu." }
          : { tone: "error", text: result.error ?? "Không lưu được." },
      }));
      router.refresh();
    });
  }

  function saveConfig(event: FormEvent) {
    event.preventDefault();
    if (
      !draft.dryRun &&
      config.dryRun &&
      !window.confirm("Tắt chạy thử: agent sẽ gửi lệnh bật/tắt THẬT tới máy lạnh. Tiếp tục?")
    ) {
      return;
    }
    run("config", () =>
      saveAcSchedulerConfig({
        leadMinutes: Number(draft.leadMinutes),
        minRemainingMinutes: Number(draft.minRemainingMinutes),
        maxConcurrentUnits: Number(draft.maxConcurrentUnits),
        dryRun: draft.dryRun,
      }),
    );
  }

  function createAgent() {
    startTransition(async () => {
      const result = await createAcAgent(agentName);
      if (result.success) {
        setNewToken(result.token);
        setFeedback((current) => ({ ...current, agents: null }));
      } else {
        setFeedback((current) => ({ ...current, agents: { tone: "error", text: result.error } }));
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card as="section" aria-labelledby="ac-config-title">
        <form onSubmit={saveConfig} className="space-y-4">
          <h2 id="ac-config-title" className="text-lg font-semibold text-ink">
            Ngưỡng an toàn
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Bật trước giờ học (phút)" htmlFor="ac-lead">
              <Input
                id="ac-lead"
                type="number"
                min={0}
                max={60}
                value={draft.leadMinutes}
                onChange={(event) => setDraft({ ...draft, leadMinutes: event.target.value })}
              />
            </Field>
            <Field label="Bật trễ khi còn ít nhất (phút)" htmlFor="ac-remaining">
              <Input
                id="ac-remaining"
                type="number"
                min={0}
                max={120}
                value={draft.minRemainingMinutes}
                onChange={(event) => setDraft({ ...draft, minRemainingMinutes: event.target.value })}
              />
            </Field>
            <Field label="Số máy cùng lúc cần xác nhận thêm" htmlFor="ac-cap">
              <Input
                id="ac-cap"
                type="number"
                min={1}
                max={500}
                value={draft.maxConcurrentUnits}
                onChange={(event) => setDraft({ ...draft, maxConcurrentUnits: event.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={draft.dryRun}
              onChange={(event) => setDraft({ ...draft, dryRun: event.target.checked })}
            />
            <span>
              <span className="font-medium">Chạy thử</span>: agent chỉ ghi log “sẽ bật/tắt”, không gửi lệnh tới máy lạnh.
            </span>
          </label>
          <div className="flex items-center gap-3">
            <Button type="submit" loading={isPending} leftIcon={<Save size={16} aria-hidden="true" />}>
              Lưu
            </Button>
            {config.paused && <Badge tone="danger">Đang dừng khẩn cấp: bật lại ở trang tool</Badge>}
            <FeedbackText value={feedback.config} />
          </div>
        </form>
      </Card>

      <Card as="section" aria-labelledby="ac-units-title" className="space-y-4">
        <div>
          <h2 id="ac-units-title" className="text-lg font-semibold text-ink">
            Danh sách máy ({unitCount})
          </h2>
          <p id="ac-units-help" className="text-sm text-muted">
            Mỗi dòng một dàn lạnh: <code>ip,tang,may_idx,ten,phong</code> (lấy từ <code>phong_map.csv</code> sau khi chạy
            lệnh <code>quet</code>). Cột <code>phong</code> là mã phòng trong lịch, nhiều phòng cách nhau bằng dấu cách.
            Máy không ghi phòng sẽ không bao giờ được bật tự động. Máy bị xoá khỏi danh sách sẽ bị vô hiệu hoá.
          </p>
        </div>
        <Textarea
          aria-labelledby="ac-units-title"
          aria-describedby="ac-units-help"
          rows={12}
          className="font-mono text-xs"
          placeholder={"ip,tang,may_idx,ten,phong\n192.168.91.13,TANG 13,0,E1-12-02,E1-12.02"}
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button loading={isPending} onClick={() => run("units", () => saveAcUnits(csv))} leftIcon={<Save size={16} aria-hidden="true" />}>
            Lưu danh sách máy
          </Button>
          <FeedbackText value={feedback.units} />
        </div>
      </Card>

      <Card as="section" aria-labelledby="ac-operators-title" className="space-y-3">
        <h2 id="ac-operators-title" className="text-lg font-semibold text-ink">
          Người được điều khiển
        </h2>
        <p className="text-sm text-muted">
          Mọi tài khoản đăng nhập đều xem được log. Chỉ người được tick mới nhập và kích hoạt lịch.
        </p>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="truncate text-ink">{user.email}</span>
              {user.isAdmin ? (
                <Badge tone="accent">Admin</Badge>
              ) : (
                <label className="inline-flex items-center gap-2 text-muted">
                  <input
                    type="checkbox"
                    checked={user.isOperator}
                    disabled={isPending}
                    onChange={(event) => run("operators", () => setAcOperator(user.id, event.target.checked))}
                  />
                  Được điều khiển
                </label>
              )}
            </li>
          ))}
        </ul>
        <FeedbackText value={feedback.operators} />
      </Card>

      <Card as="section" aria-labelledby="ac-agents-title" className="space-y-4">
        <div>
          <h2 id="ac-agents-title" className="text-lg font-semibold text-ink">
            Agent trong mạng trường
          </h2>
          <p className="text-sm text-muted">
            Token chỉ hiện một lần. Dán vào biến <code>AC_AGENT_TOKEN</code> trên máy chạy agent.
          </p>
        </div>

        {agents.length > 0 && (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {agents.map((agent) => (
              <li key={agent.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{agent.name}</span>
                  <span className="block text-xs text-muted">
                    {agent.lastSeenAt ? `Lần cuối ${formatAcClock(agent.lastSeenAt)} từ ${agent.lastIp ?? "?"}` : "Chưa kết nối"}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 size={16} aria-hidden="true" />}
                  onClick={() => {
                    if (window.confirm(`Thu hồi token của "${agent.name}"?`)) run("agents", () => revokeAcAgent(agent.id));
                  }}
                >
                  Thu hồi
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <Field label="Tên agent" htmlFor="ac-agent-name" className="min-w-[220px] flex-1">
            <Input id="ac-agent-name" value={agentName} onChange={(event) => setAgentName(event.target.value)} />
          </Field>
          <Button loading={isPending} onClick={createAgent} leftIcon={<KeyRound size={16} aria-hidden="true" />}>
            Tạo token
          </Button>
        </div>

        {newToken && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warn/40 bg-warn-soft p-3 text-sm">
            <code className="break-all font-mono text-ink">{newToken}</code>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Copy size={16} aria-hidden="true" />}
              onClick={() => void navigator.clipboard.writeText(newToken)}
            >
              Copy
            </Button>
          </div>
        )}
        <FeedbackText value={feedback.agents} />
      </Card>
    </div>
  );
}

function FeedbackText({ value }: { value: Feedback | undefined }) {
  if (!value) return null;
  return (
    <span role="status" className={value.tone === "ok" ? "text-sm text-success" : "text-sm text-danger"}>
      {value.text}
    </span>
  );
}
