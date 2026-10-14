# Spec — Công cụ kiểm tra tốc độ mạng

> Ngày: 2026-10-14 · Trạng thái: chờ duyệt spec
> Nguồn quyết định: brainstorming trong phiên làm việc cùng ngày.

## 1. Mục tiêu

Thêm công cụ **kiểm tra tốc độ mạng công khai** vào mục Công cụ của site, cạnh Tool lọc mic. Ai vào site cũng đo được, không cần đăng nhập, giao diện dễ hiểu và có giải thích kết quả.

**Thành công khi:** người dùng bấm một nút, khoảng 20–40 giây sau thấy tốc độ tải xuống, tải lên, ping, độ dao động và đánh giá dễ hiểu cho xem video, chơi game, gọi video. Kết quả sát với speed.cloudflare.com và lượng dữ liệu tiêu tốn có giới hạn.

## 2. Quyết định đã chốt

| Vấn đề | Quyết định |
|---|---|
| Đối tượng | Công khai cho mọi người |
| Cách đo | Thư viện chính thức **`@cloudflare/speedtest@1.14.2`** (MIT), chạy trong trình duyệt, đo tới máy chủ Cloudflare gần nhất |
| Lưu trữ | Không lưu gì, không có API phía server |
| Giới hạn dữ liệu | Có, xem §5 |
| Mất gói | **Không đo.** Thư viện cần TURN server riêng; ngoài phạm vi |
| Không làm | Lịch sử, biểu đồ, chọn máy chủ, hiển thị IP/nhà mạng |

## 3. Trải nghiệm người dùng

Route: `/tools/speed-test` (trong `app/(public)`, có Navbar/Footer).

Trạng thái:

1. **Chưa đo** — `PageHeader` (eyebrow "Công cụ", h1 "Kiểm tra tốc độ mạng", mô tả ngắn), nút lớn **"Bắt đầu đo"**, dòng phụ: "Mỗi lần đo dùng tối đa khoảng 150 MB dữ liệu. Nên dùng wifi nếu đang dùng 4G/5G." Thư viện chỉ được tải (`import()`) khi bấm nút.
2. **Đang đo** — 4 ô số: **Tải xuống** (Mbps), **Tải lên** (Mbps), **Ping** (ms), **Độ dao động** (ms). Ô chưa có số hiện "—"; ô đang được đo có nhãn "Đang đo…". Nút **Dừng** (gọi `pause()`); sau khi dừng có nút **Tiếp tục** và **Đo lại**.
3. **Đo xong** — 4 số cuối cùng, thêm dòng phụ **Ping khi đang tải xuống / tải lên** (loaded latency). Khối **Đánh giá chất lượng** gồm 3 dòng: **Xem video**, **Chơi game**, **Gọi video**, mỗi dòng mức **Tốt / Khá / Kém** bằng chữ + icon (không chỉ dựa vào màu). Nút **Đo lại** và **Sao chép kết quả** (copy đoạn văn bản ngắn, báo "Đã sao chép").
4. **Lỗi** — `ErrorState` với thông điệp dễ hiểu và nút **Thử lại**; giữ lại các số đã đo được nếu có. Phân biệt: không tải được thư viện / lỗi trong lúc đo.

Ghi chú nhỏ cuối trang: "Đo bằng mạng lưới của Cloudflare. Kết quả phụ thuộc thiết bị, trình duyệt và các ứng dụng khác đang dùng mạng."

Trang chủ: `ToolsSection` thêm thẻ "Kiểm tra tốc độ mạng" (icon `Gauge`, Badge "Sẵn sàng") cạnh Tool lọc mic; **giữ** dòng "Các công cụ khác sẽ được bổ sung dần."

A11y & giao diện: dùng primitives và token sẵn có (`@/components/ui`), tiếng Việt có dấu, theo nút sáng/tối. Số liệu dùng `font-mono tabular-nums`. Có một vùng `aria-live="polite"` chỉ thông báo khi một hạng mục đo xong ("Đã đo xong tải xuống: 85,3 Mbps") và khi hoàn tất — không đọc từng lần số nhảy. Nút ≥ 44px. Không tràn ngang ở 375px. Tôn trọng `prefers-reduced-motion` (không animation số).

## 4. Kiến trúc

```
src/tools/speed-test/          # logic thuần, không React, có unit test
  config.ts                    # MEASUREMENTS đã giới hạn dữ liệu + các hằng số
  format.ts                    # bps → Mbps, làm tròn, định dạng ms, "—" khi chưa có
  quality.ts                   # AIM scores → Tốt/Khá/Kém + nhãn VI; buildResultText()
  __tests__/format.test.ts
  __tests__/quality.test.ts
src/components/tools/SpeedTestTool.tsx   # client component, state machine
app/(public)/tools/speed-test/page.tsx   # server page mỏng: metadata + PageHeader + SpeedTestTool
src/components/home/ToolsSection.tsx     # thêm thẻ công cụ
```

**`SpeedTestTool`** giữ state `idle → loading-lib → running ⇄ paused → done | error`.
- Khi bấm "Bắt đầu": `const { default: SpeedTest } = await import("@cloudflare/speedtest")`, tạo `new SpeedTest({ autoStart: true, measurements: MEASUREMENTS })`.
- `onResultsChange({ type })`: đọc `results.getSummary()` để cập nhật 4 ô; khi `type` của một hạng mục đổi sang hạng mục khác thì đẩy thông báo `aria-live`.
- `onFinish(results)`: lấy `getSummary()` + `getScores()` → state `done`.
- `onError(message)`: state `error`, giữ summary hiện có.
- Đo lại: `engine.restart()`. Unmount: `engine.pause()` và bỏ tham chiếu.
- Engine instance nằm trong `useRef`, không re-render vì nó.

**Luồng dữ liệu:** trình duyệt ↔ `speed.cloudflare.com` trực tiếp (đã kiểm tra: `Access-Control-Allow-Origin: *` cho `__down` và `__up`; site không có CSP chặn). Không qua server Next.js, không ghi DB.

**`quality.ts`:** `getScores()` trả điểm AIM cho `streaming`, `gaming`, `rtc` (mỗi mục có `points` và `classificationName`). Ánh xạ `classificationName`: `great`/`good` → **Tốt**, `average` → **Khá**, `poor`/`bad` → **Kém**; giá trị lạ → "Chưa đủ dữ liệu". Kiểu dữ liệu của scores phải kiểm tra lại trong `dist/speedtest.d.ts` khi cài; nếu khác, điều chỉnh ánh xạ nhưng giữ 3 mức hiển thị.

**`buildResultText(summary, scores, date)`** ví dụ:
```
Kết quả đo tốc độ mạng (14/10/2026 21:30)
Tải xuống: 85,3 Mbps · Tải lên: 32,1 Mbps
Ping: 18 ms · Dao động: 2 ms
Xem video: Tốt · Chơi game: Khá · Gọi video: Tốt
Đo bằng Cloudflare tại {origin}/tools/speed-test
```
(dòng cuối dùng `location.origin` khi gọi từ component; hàm nhận origin làm tham số để test được.)

Định dạng số theo kiểu Việt Nam: dấu phẩy thập phân, 1 chữ số thập phân cho Mbps < 100, số nguyên cho ≥ 100; ms làm tròn số nguyên.

## 5. Giới hạn dữ liệu (`config.ts`)

Bỏ các lượt 100 MB / 250 MB / 50 MB của cấu hình mặc định và bỏ `packetLoss`:

```ts
[
  { type: "latency", numPackets: 1 },
  { type: "download", bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "latency", numPackets: 20 },
  { type: "download", bytes: 1e5, count: 9 },
  { type: "download", bytes: 1e6, count: 8 },
  { type: "upload", bytes: 1e5, count: 8 },
  { type: "upload", bytes: 1e6, count: 6 },
  { type: "download", bytes: 1e7, count: 4 },
  { type: "upload", bytes: 1e7, count: 4 },
  { type: "download", bytes: 2.5e7, count: 2 },
]
```

Trần lý thuyết: tải xuống ≈ 99 MB, tải lên ≈ 47 MB → **≈ 146 MB** trên mạng rất nhanh. Thư viện dừng tăng kích thước khi một lượt đạt ≥ 1 giây, nên mạng chậm dùng ít hơn nhiều. Độ chính xác giữ tốt tới vài trăm Mbps.

## 6. Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `import()` thư viện thất bại | `ErrorState` "Không tải được công cụ đo. Kiểm tra kết nối rồi thử lại." + Thử lại |
| `onError` trong lúc đo | `ErrorState` "Đo bị gián đoạn…" + Thử lại; giữ số đã có |
| Mất mạng (`navigator.onLine === false` lúc bấm) | Báo ngay "Thiết bị đang không có mạng" |
| `navigator.clipboard` không dùng được | Nút sao chép báo "Không sao chép được" |

## 7. Kiểm thử

- Unit test (`node --test`, như các test hiện có): `format.ts` (Mbps, làm tròn, dấu phẩy, giá trị rỗng/NaN/0), `quality.ts` (ánh xạ từng mức, giá trị lạ, `buildResultText`).
- `npm run lint`, `npx tsc --noEmit`, `npm test`, `next build`.
- Trình duyệt (dev server): đo thật đến hết; Dừng / Tiếp tục / Đo lại; Sao chép; sáng và tối; 375 / 1024px không tràn ngang; dùng `read_network_requests` đếm tổng byte để xác nhận đúng giới hạn §5.

## 8. Tài liệu

- `docs/TECHNICAL.md`: thêm mục 7.x "Kiểm tra tốc độ mạng" + cập nhật cây thư mục và bảng tech stack.
- `docs/PROJECT_HISTORY.md` §8: ghi mốc `2026-10-14`.
