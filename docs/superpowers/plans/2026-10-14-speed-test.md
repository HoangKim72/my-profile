# Speed Test Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public network speed test at `/tools/speed-test`, listed in the homepage Tools section.

**Architecture:** Browser-only measurement with `@cloudflare/speedtest`, lazy-loaded on click. Pure logic (config, formatting, quality mapping, copy text) lives in `src/tools/speed-test/` with `node --test` unit tests; one client component owns the engine and UI state; a thin server page hosts it.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 tokens + `@/components/ui` primitives, `@cloudflare/speedtest@1.14.2`, `node:test` via `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-14-speed-test-design.md`

## Global Constraints

- Branch `feat/speed-test`. Do not touch business logic outside this feature.
- Dependency pinned exactly: `"@cloudflare/speedtest": "1.14.2"`.
- Engine options always include `logAimApiUrl: null` (no result logging) and never a `packetLoss` measurement.
- All UI copy Vietnamese with diacritics; numbers Vietnamese style (decimal comma).
- UI uses design tokens/primitives only (`bg-surface`, `text-ink`, `text-muted`, `border-line`, `accent`, `Button`, `ButtonLink`, `Card`, `Badge`, `PageHeader`, `ErrorState`); no raw palette colours, no `rounded-[Npx]`, no arbitrary shadows, no hover translate/scale.
- Buttons for primary actions are size `md` (≥ 44px). Numbers use `font-mono tabular-nums`.
- No horizontal scroll at 375px. Works in light and dark (`data-theme`).
- Tests: `npm test` (`node --import tsx --test "src/**/__tests__/*.test.ts"`), style as in `src/tools/mic-filter/__tests__/config.test.ts` (`describe/it` from `node:test`, `assert` from `node:assert/strict`).

## Review Focus

- Summary fields missing mid-run (`download`/`upload`/`latency`/`jitter` undefined) → cells show "—", never "NaN" or "0". Pinned in Task 1 (`formatMbps`/`formatMs` with `undefined`, `NaN`).
- Very fast or very slow links (0.4 Mbps, 950 Mbps) → sensible precision ("0,4", "950"). Pinned in Task 1.
- `getScores()` missing an experience or returning an unknown class → row shows "Chưa đủ dữ liệu" instead of crashing. Pinned in Task 2.
- User leaves the page mid-test → engine paused, no setState after unmount. Pinned in Task 3 (manual check step).
- Clicking Bắt đầu twice / Đo lại while running → exactly one engine instance. Pinned in Task 3 (manual check step).

---

### Task 1: Dependency, config and number formatting

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Create: `src/tools/speed-test/config.ts`, `src/tools/speed-test/format.ts`
- Test: `src/tools/speed-test/__tests__/format.test.ts`, `src/tools/speed-test/__tests__/config.test.ts`

**Interfaces:**
- Produces:
  - `MEASUREMENTS: MeasurementConfig[]` (type imported with `import type { MeasurementConfig } from "@cloudflare/speedtest"`)
  - `ENGINE_OPTIONS: ConfigOptions` = `{ autoStart: true, measurements: MEASUREMENTS, logAimApiUrl: null }`
  - `estimateMaxBytes(measurements: MeasurementConfig[]): { download: number; upload: number }`
  - `formatMbps(bps: number | undefined): string`
  - `formatMs(ms: number | undefined): string`
  - `formatMegabytes(bytes: number): string` (for the data-usage note)

- [ ] **Step 1:** `npm install --save-exact @cloudflare/speedtest@1.14.2`; confirm `package.json` shows `"1.14.2"` without caret.
- [ ] **Step 2: Write failing tests**

```ts
// config.test.ts
it("never measures packet loss", () => assert.ok(MEASUREMENTS.every((m) => m.type !== "packetLoss")));
it("disables result logging", () => assert.equal(ENGINE_OPTIONS.logAimApiUrl, null));
it("caps data at ~146 MB", () => {
  const { download, upload } = estimateMaxBytes(MEASUREMENTS);
  assert.equal(download, 99_000_000);
  assert.equal(upload, 46_800_000);
});

// format.test.ts
it("formats Mbps", () => {
  assert.equal(formatMbps(85_300_000), "85,3");
  assert.equal(formatMbps(400_000), "0,4");
  assert.equal(formatMbps(950_400_000), "950");
  assert.equal(formatMbps(100_000_000), "100");
});
it("shows a dash when missing", () => {
  for (const v of [undefined, NaN, -1]) { assert.equal(formatMbps(v), "—"); assert.equal(formatMs(v), "—"); }
});
it("formats ms as integers", () => { assert.equal(formatMs(17.6), "18"); assert.equal(formatMs(0), "0"); });
it("formats megabytes", () => assert.equal(formatMegabytes(146_000_000), "146"));
```

- [ ] **Step 3:** Run `npm test` → new tests FAIL (modules missing).
- [ ] **Step 4:** Implement `config.ts` with the exact list from spec §5 (latency 1; download 1e5×1 bypassMinDuration; latency 20; download 1e5×9; download 1e6×8; upload 1e5×8; upload 1e6×6; download 1e7×4; upload 1e7×4; download 2.5e7×2). `estimateMaxBytes` sums `bytes × count` per direction. Implement `format.ts`: Mbps = bps/1e6, one decimal below 100 else integer, decimal comma (`toLocaleString("vi-VN", …)` or manual replace — must equal the test strings exactly); `formatMs` rounds; invalid/negative → "—".
- [ ] **Step 5:** `npm test` → PASS; `npx tsc --noEmit` clean.
- [ ] **Step 6: Commit** `feat(speed-test): add engine config and number formatting`.

### Task 2: Quality mapping and copy text

**Files:**
- Create: `src/tools/speed-test/quality.ts`
- Test: `src/tools/speed-test/__tests__/quality.test.ts`

**Interfaces:**
- Consumes: `formatMbps`, `formatMs` (Task 1); types `Scores`, `MeasurementSummary`, `ClassificationName` from `@cloudflare/speedtest`.
- Produces:
  - `type QualityLevel = "good" | "fair" | "poor" | "unknown"`
  - `EXPERIENCES: ReadonlyArray<{ key: "streaming" | "gaming" | "rtc"; label: string }>` = Xem video / Chơi game / Gọi video
  - `QUALITY_LABEL: Record<QualityLevel, string>` = Tốt / Khá / Kém / Chưa đủ dữ liệu
  - `toQualityLevel(name: ClassificationName | string | undefined): QualityLevel`
  - `getExperienceQualities(scores: Scores | undefined): Array<{ key; label; level: QualityLevel }>`
  - `buildResultText(summary: MeasurementSummary, scores: Scores | undefined, measuredAt: Date, origin: string): string`

- [ ] **Step 1: Write failing tests**

```ts
it("maps classifications", () => {
  assert.equal(toQualityLevel("great"), "good"); assert.equal(toQualityLevel("good"), "good");
  assert.equal(toQualityLevel("average"), "fair");
  assert.equal(toQualityLevel("poor"), "poor"); assert.equal(toQualityLevel("bad"), "poor");
  assert.equal(toQualityLevel("weird"), "unknown"); assert.equal(toQualityLevel(undefined), "unknown");
});
it("handles missing scores", () => {
  const rows = getExperienceQualities({ streaming: { points: 30, classificationName: "great" } } as Scores);
  assert.deepEqual(rows.map((r) => r.level), ["good", "unknown", "unknown"]);
  assert.deepEqual(getExperienceQualities(undefined).map((r) => r.level), ["unknown", "unknown", "unknown"]);
});
it("builds copy text", () => {
  const text = buildResultText(
    { download: 85_300_000, upload: 32_100_000, latency: 17.6, jitter: 2.2 },
    { streaming: { points: 1, classificationName: "great" }, gaming: { points: 1, classificationName: "average" }, rtc: { points: 1, classificationName: "good" } } as Scores,
    new Date(2026, 9, 14, 21, 30), "https://example.com");
  assert.equal(text, [
    "Kết quả đo tốc độ mạng (14/10/2026 21:30)",
    "Tải xuống: 85,3 Mbps · Tải lên: 32,1 Mbps",
    "Ping: 18 ms · Dao động: 2 ms",
    "Xem video: Tốt · Chơi game: Khá · Gọi video: Tốt",
    "Đo bằng Cloudflare tại https://example.com/tools/speed-test",
  ].join("\n"));
});
```

- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement `quality.ts` (date as `dd/MM/yyyy HH:mm` with zero padding, local time).
- [ ] **Step 4:** `npm test` → PASS; `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** `feat(speed-test): add quality mapping and result text`.

### Task 3: Speed test UI and page

**Files:**
- Create: `src/components/tools/SpeedTestTool.tsx` (`"use client"`), `app/(public)/tools/speed-test/page.tsx`

**Interfaces:**
- Consumes: `ENGINE_OPTIONS`, `estimateMaxBytes`, `MEASUREMENTS`, `formatMbps`, `formatMs`, `formatMegabytes` (Task 1); `EXPERIENCES`, `QUALITY_LABEL`, `getExperienceQualities`, `buildResultText` (Task 2); `Button`, `Card`, `Badge`, `PageHeader`, `ErrorState` from `@/components/ui`.
- Produces: `export function SpeedTestTool(): JSX.Element`; page metadata `{ title: "Kiểm tra tốc độ mạng", description: "Đo tốc độ tải xuống, tải lên, ping và độ dao động của mạng bằng Cloudflare." }`.

- [ ] **Step 1:** Page: server component in `app/(public)` (layout already gives Navbar/Footer/`<main>`); render `container-custom` + `PageHeader` (eyebrow "Công cụ", title "Kiểm tra tốc độ mạng", description from metadata) + `<SpeedTestTool />`. Do not render `<main>` or `min-h-screen`.
- [ ] **Step 2:** Component state: `status: "idle" | "loading" | "running" | "paused" | "done" | "error"`, `summary: MeasurementSummary`, `scores?: Scores`, `phase?: MeasurementType`, `error?: { kind: "load" | "run" | "offline"; message }`, `announcement: string`, `copyState: "idle" | "copied" | "failed"`. Engine in `useRef`; guard so a second start while `loading|running` is a no-op; `useEffect` cleanup calls `engine.pause()` and sets a `mounted` ref false before any later setState.
- [ ] **Step 3:** Start flow: if `!navigator.onLine` → error `offline` ("Thiết bị đang không có mạng."); else `loading` → `import("@cloudflare/speedtest")` (failure → error `load`: "Không tải được công cụ đo. Kiểm tra kết nối rồi thử lại.") → `new SpeedTest(ENGINE_OPTIONS)`; wire `onResultsChange` (update summary from `engine.results.getSummary()`, track phase, announce "Đã đo xong {tải xuống|tải lên|ping}: …" when phase switches), `onFinish` (summary + `getScores()` → `done`, announce "Đã đo xong."), `onError` (→ error `run`: "Đo bị gián đoạn. Vui lòng thử lại.", keep summary).
- [ ] **Step 4:** Layout per spec §3: intro note with data usage computed from `estimateMaxBytes(MEASUREMENTS)` ("Mỗi lần đo dùng tối đa khoảng {N} MB dữ liệu. Nên dùng wifi nếu đang dùng 4G/5G."); primary `Button` "Bắt đầu đo" (Gauge icon) in idle; grid of 4 metric `Card`s (2 cols mobile, 4 cols ≥ lg) — label, big mono number, unit, "Đang đo…" Badge on the active phase; when done, a line "Ping khi đang tải: xuống {downLoadedLatency} ms · lên {upLoadedLatency} ms"; Quality card with 3 rows (icon + text level, tone success/warn/danger/neutral); actions: running → "Dừng" (secondary), paused → "Tiếp tục" + "Đo lại", done → "Đo lại" + "Sao chép kết quả" (shows "Đã sao chép"/"Không sao chép được"); error → `ErrorState` with "Thử lại" action, metrics still shown if any; footer note "Đo bằng mạng lưới của Cloudflare. Kết quả phụ thuộc thiết bị, trình duyệt và các ứng dụng khác đang dùng mạng." One visually hidden `<p aria-live="polite">` for `announcement`.
- [ ] **Step 5:** `npx eslint src/components/tools/SpeedTestTool.tsx "app/(public)/tools/speed-test"` and `npx tsc --noEmit` clean.
- [ ] **Step 6: Browser check** (dev server `next-dev` from `.claude/launch.json`): run a full test at `/tools/speed-test`; numbers appear progressively and final; Dừng/Tiếp tục/Đo lại work; rapid double click on Bắt đầu creates one run (network panel shows one ramp); navigate away mid-run → no console errors; Sao chép works; light + dark; 375px and 1024px `scrollWidth === clientWidth`; `read_network_requests` filtered by `speed.cloudflare.com` — no request to `__results`, no `__down?bytes=` larger than `25000000`.
- [ ] **Step 7: Commit** `feat(speed-test): add speed test page and tool UI`.

### Task 4: Homepage card and docs

**Files:**
- Modify: `src/components/home/ToolsSection.tsx`, `docs/TECHNICAL.md`, `docs/PROJECT_HISTORY.md`

**Interfaces:**
- Consumes: route `/tools/speed-test` (Task 3).

- [ ] **Step 1:** Add a second tool card (same structure as the mic card, `Gauge` icon, Badge "Sẵn sàng", title "Kiểm tra tốc độ mạng", description "Đo tốc độ tải xuống, tải lên, ping và độ dao động ngay trên trình duyệt, kèm đánh giá cho xem video, chơi game và gọi video.", CTA "Mở công cụ"). Cards in a responsive grid (1 col mobile, 2 cols ≥ md). Keep the line "Các công cụ khác sẽ được bổ sung dần."
- [ ] **Step 2:** `TECHNICAL.md`: add `@cloudflare/speedtest` to tech stack table; add `speed-test/` to the folder tree (`src/tools/`, `components/tools/SpeedTestTool`, `(public)/tools/speed-test`); new section "7.7. Kiểm tra tốc độ mạng" summarising spec §2–§6 (browser-only, limits, `logAimApiUrl: null`, no packet loss).
- [ ] **Step 3:** `PROJECT_HISTORY.md` §8 under `2026-10-14`: new sub-heading "Công cụ kiểm tra tốc độ mạng" — decisions, files, verification results (fill with actual results).
- [ ] **Step 4:** Full verification: `npm run lint`, `npm test`, `npx next build` all pass; homepage at 375px shows both cards without horizontal scroll.
- [ ] **Step 5: Commit** `feat(speed-test): list tool on homepage and document it`.
