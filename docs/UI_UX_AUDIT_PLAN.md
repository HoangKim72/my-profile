# UI/UX Audit & Plan — `my-profile` (Anh coder)

> Ngày: 2026-10-14 · Nhánh: `feat/hardening-and-resources` · Trạng thái: **đã duyệt 2026-10-14**
> Phạm vi: toàn bộ public site, auth, dashboard. Tool lọc mic chỉ rà a11y (vừa redesign ở `933ffe4`).

---

## 1. Tóm tắt đánh giá

Sản phẩm có 3 lớp rõ ràng (public / dashboard / tool) nhưng **giao diện chưa thống nhất thành một hệ thống**. Tool lọc mic đã có design token riêng và gọn gàng; phần còn lại dùng class Tailwind viết tay, nhiều gradient, glow, bo góc tuỳ hứng, và ngôn ngữ lẫn lộn. Vấn đề lớn nhất không phải "chưa đẹp" mà là **thiếu nhất quán, thiếu a11y cơ bản và có nhiều nội dung giả/placeholder** làm giảm độ tin cậy.

| Hạng mục | Điểm | Ghi chú ngắn |
|---|---|---|
| Accessibility | 3/10 | 0 `focus-visible`, chỉ 6 `aria-label`, `lang="en"` cho nội dung tiếng Việt, không có `prefers-reduced-motion` |
| Nhất quán visual | 4/10 | 10+ kiểu bo góc (`rounded-[22/24/26/28/30/32px]`…), 17 shadow arbitrary, 2 hệ màu song song |
| Nội dung & ngôn ngữ | 3/10 | 14 file tiếng Việt **không dấu**, EN/VI trộn trong cùng màn, link `#` chết, 15 ô "Đang phát triển" |
| Information architecture | 5/10 | `/projects` (Kho tài liệu) và `/cv` không có trên navbar; dashboard bị lồng navbar + footer public |
| Responsive | 6/10 | Mobile dùng được, nhưng sidebar dashboard chiếm gần 1 màn hình trước khi tới nội dung |
| Tool lọc mic | 8/10 | Token riêng, font Be Vietnam Pro, ổn. Chỉ cần focus ring |

---

## 2. Phát hiện chi tiết (theo mức độ ưu tiên)

### P1 — Critical

1. **Không có focus ring bàn phím.** Toàn bộ link/nút không có `focus-visible:*`; input dùng `focus:outline-none` + ring. Người dùng bàn phím không biết mình đang ở đâu.
2. **`<html lang="en">`** ([app/layout.tsx:18](../app/layout.tsx)) trong khi nội dung chủ yếu tiếng Việt → screen reader đọc sai, trình duyệt gợi ý dịch sai.
3. **Tiếng Việt không dấu** ở 14 file: `Sidebar.tsx`, `dashboard/page.tsx` (16 chỗ), `dashboard/layout.tsx`, `ProfileSettingsForm.tsx` (12), `lib/skills/data.ts` (27), `resume-view.ts`, `ProfileResume.tsx`, `SkillsShowcase.tsx`, login/register (FullscreenLoader), metadata của `/cv`, `/skills`, `/about`… Ví dụ: *"Dang dang nhap"*, *"Quan ly portfolio va tai nguyen cong khai"*.
4. **Dashboard lồng trong layout public.** `RootLayout` render `Navbar` + `Footer` cho mọi route, nên `/dashboard` có: navbar public → sidebar → header dashboard → nội dung → footer public. 3 lớp điều hướng, 2 khối hồ sơ người dùng trùng nhau (sidebar + header).
5. **Thiếu `aria-label` cho nút icon** — nút mở menu mobile ([NavbarClient.tsx:250](../src/components/layout/NavbarClient.tsx)) chỉ có icon, không có nhãn, không `aria-controls`, không đóng bằng `Esc`.

### P2 — High

6. **Trang chủ: 15/16 ô là "Chức năng đang phát triển"** với icon ngẫu nhiên. Trang đầu tiên người dùng thấy chủ yếu là placeholder → cảm giác site chưa xong. Kho tài liệu (tính năng thật) không xuất hiện trên trang chủ.
7. **IA/Navbar:** `NAV_LINKS` = Home / About / Skills / Contact. Thiếu **Kho tài liệu** (`/projects`), **CV**, **Công cụ**. Nhãn tiếng Anh trong khi nội dung tiếng Việt.
8. **Footer toàn placeholder:** GitHub/LinkedIn/Twitter/Privacy/Terms đều `href="#"`, email `hello@example.com`, câu mô tả template "A modern portfolio…". Dữ liệu thật đã có trong `site-profile`.
9. **Ngôn ngữ trộn:** Login/Register/Contact toàn tiếng Anh; nút "Logout", nhãn "Logged in", "Workspace overview", "Control Center"… cạnh tiêu đề tiếng Việt.
10. **Hover làm dịch chuyển layout:** `hover:-translate-y-*` / `active:scale-95` trên card, nav, nút (7 file). Gây giật, khó click chính xác, không tôn trọng `prefers-reduced-motion`.
11. **Tương tác phụ thuộc hover:** SkillsShowcase ghi *"Hover desktop hoac tap mobile de mo project evidence"* → nội dung quan trọng ẩn sau hover.
12. **Sidebar dashboard trên mobile:** logo + thẻ hồ sơ + đoạn mô tả + 2 nút + lưới nav dạng card cao 4 dòng — người dùng phải cuộn ~1 màn hình mới tới nội dung.

### P3 — Medium

13. **Không có design token cho site chính.** Chỉ tool mic có token (`--mic-*`). Phần còn lại: `blue/cyan/fuchsia/emerald/purple/pink` gradient, `text-gradient` blue→purple, 10 giá trị bo góc, 17 shadow tự chế. `.card`, `.btn-*` có trong `globals.css` nhưng ít được dùng.
14. **Font:** site dùng font hệ thống (`Segoe UI Variable`…) — trên macOS/Android sẽ khác hẳn. Tool mic dùng Be Vietnam Pro. Nên dùng chung **Be Vietnam Pro** (hỗ trợ tiếng Việt tốt) qua `next/font`.
15. **Navbar quá nặng:** cao 78px + padding, glow blur, gradient line, logo radial gradient — chiếm nhiều chỗ, nhất là mobile. Nhãn "PORTFOLIO" không đúng bản chất site (bảng công cụ + kho tài liệu).
16. **Text quá nhỏ / tracking quá rộng:** `text-[11px] uppercase tracking-[0.34em]` dùng làm eyebrow ở nhiều chỗ, khó đọc.
17. **Trạng thái lỗi/rỗng:** khi DB lỗi, `/projects` và `/about` render rỗng im lặng, không thông báo cho người dùng.
18. **Code chết:** `Hero.tsx` không được dùng, chứa số liệu giả "15+ Projects".

### Điểm tốt nên giữ

- Tool lọc mic: token theo vai trò (`morn/noon/done`), dark mode chuẩn, bảng đọc tốt → **dùng làm mẫu** cho cả site.
- Form `/projects` có `<label for>` đầy đủ, filter dùng GET (share được URL).
- Honeypot `website` ẩn đúng cách (`aria-hidden`, `tabIndex=-1`).

---

## 3. Định hướng thiết kế

- **Phong cách:** *Flat, utility-first, ít trang trí.* Đây là site công cụ + kho tài liệu, không phải landing page sáng tạo → bỏ glow/radial gradient/blur trang trí, giữ 1 màu nhấn.
- **Màu:** nền trung tính (`#FAFAFA` / `#0B0D10`), chữ `#0F172A` / `#EEF1F5`, muted tối thiểu slate-600, **1 accent `#2457D6`** (trùng `--mic-primary` để tool và site cùng họ), màu trạng thái success/warn/danger.
- **Font:** Be Vietnam Pro (sans) + JetBrains Mono (số/mã) — đã có trong tool mic.
- **Thang đo:** radius `sm 8 / md 12 / lg 16` (bỏ toàn bộ `rounded-[Npx]`); shadow `sm / md` 2 mức; spacing theo bội 4.
- **Motion:** chỉ đổi màu/viền/opacity 150–200ms; không translate/scale khi hover; tắt animation khi `prefers-reduced-motion`.
- **Ngôn ngữ:** 100% tiếng Việt có dấu cho UI (trừ tên riêng/thuật ngữ như "Dashboard" nếu muốn giữ — đề xuất dùng "Bảng điều khiển").

---

## 4. Kế hoạch triển khai (giao cho đội dev)

Chia 6 gói việc. **WS0 phải xong trước**, sau đó WS1–WS4 chạy song song (mỗi gói sở hữu file riêng, không đụng nhau), cuối cùng WS5 QA.

```
WS0 Foundation ──┬── WS1 Layout shell ──┐
                 ├── WS2 Trang chủ & IA ┤
                 ├── WS3 Public pages ──┼── WS5 QA & a11y verify
                 └── WS4 Dashboard ─────┘
```

### WS0 — Foundation: design tokens & UI primitives *(blocking)*
**File sở hữu:** `app/globals.css`, `app/layout.tsx`, `src/components/ui/*` (mới)
- Định nghĩa token site (`--surface`, `--ink`, `--muted`, `--line`, `--accent`, `--success/warn/danger` + `-soft`) light/dark trong `globals.css`, map qua `@theme inline` giống cách tool mic làm.
- Global: `:focus-visible` ring 2px accent + offset; `@media (prefers-reduced-motion)` tắt animation/transition; bỏ `active:scale-95` khỏi `.btn-*`.
- `app/layout.tsx`: `lang="vi"`, nạp Be Vietnam Pro + JetBrains Mono bằng `next/font` cho toàn site.
- Tạo primitives tối giản (không thêm thư viện): `Button` (primary/secondary/ghost/danger, size sm/md, `loading`), `Input`/`Select`/`Textarea` + `Field` (label, hint, error), `Card`, `Badge`, `PageHeader` (eyebrow, title, description, actions), `EmptyState`/`ErrorState`.
- **Tiêu chí xong:** `npm run lint` + `npm run build` sạch; primitives có focus ring, touch target ≥ 44px ở size md.

### WS1 — Layout shell: navbar, footer, sidebar, tách layout
**File sở hữu:** `app/(public)/layout.tsx` (mới), `app/(auth)/layout.tsx` (mới), `app/(dashboard)/dashboard/layout.tsx`, `src/components/layout/*`, `src/lib/utils/constants.ts`
- Chuyển `Navbar`/`Footer` khỏi `RootLayout` sang layout của `(public)` (và trang chủ). Dashboard chỉ còn sidebar + nội dung. Auth dùng layout tối giản (logo + nút về trang chủ).
- Navbar: cao 64px, bỏ glow/blur/gradient line; nav tiếng Việt: *Trang chủ · Kho tài liệu · Công cụ · Kỹ năng · Giới thiệu · Liên hệ*; nút menu có `aria-label`, `aria-controls`, đóng khi `Esc` / đổi route; nút tài khoản gọn (avatar + menu).
- Footer: lấy GitHub/LinkedIn/email từ `site-profile`; ẩn mục không có dữ liệu; bỏ Privacy/Terms `#`; mô tả tiếng Việt thật.
- Sidebar: nav dạng list gọn (icon + nhãn, không mô tả dài), bỏ khối "Khu quản trị…"; trên mobile thành thanh trên cùng + drawer. Header dashboard: chỉ breadcrumb/tiêu đề trang, bỏ khối hồ sơ trùng.
- Sửa toàn bộ tiếng Việt không dấu trong các file sở hữu.

### WS2 — Trang chủ & IA
**File sở hữu:** `app/page.tsx` (→ chuyển vào `(public)`), `src/components/features/Hero.tsx` (xoá)
- Thay lưới 16 ô bằng: phần mở đầu ngắn (ai, site để làm gì) → **khối "Công cụ"** (Tool lọc mic nổi bật + 1 dòng "Thêm công cụ sẽ được bổ sung") → **khối "Kho tài liệu"** (3–6 tài liệu mới nhất + link xem tất cả, có empty/error state) → lối tắt Giới thiệu/CV/Liên hệ.
- Xoá `Hero.tsx` (code chết, số liệu giả).

### WS3 — Public pages
**File sở hữu:** `app/(public)/{about,cv,skills,contact,projects}/**`, `app/(auth)/**/page.tsx`, `src/components/features/{ContactForm,ProfileResume,SkillsShowcase}.tsx`, `src/components/projects/{ProjectCard,ArchiveContents}.tsx`, `src/lib/skills/data.ts`, `src/lib/profile/resume-view.ts`
- Áp dụng `PageHeader`, `Card`, `Button`, `Field` thay class viết tay; bỏ `text-gradient`, `hover:-translate-y`.
- Login/Register/Contact: dịch sang tiếng Việt, lỗi hiển thị cạnh field + `aria-live`, giữ honeypot.
- `/projects`: error state khi DB lỗi, empty state có nút "Xoá lọc", card không dịch chuyển khi hover.
- SkillsShowcase: thay tương tác hover bằng click/tap (disclosure có `aria-expanded`).
- Sửa tiếng Việt không dấu (`data.ts`, `resume-view.ts`, `ProfileResume`, `SkillsShowcase`, metadata).

### WS4 — Dashboard pages
**File sở hữu:** `app/(dashboard)/dashboard/{page,projects/**,settings,tools/**}.tsx`, `src/components/projects/ProjectForm.tsx`, `src/components/features/ProfileSettingsForm.tsx`, `src/components/tools/MicFilterConfigForm.tsx`
- Trang tổng quan: 4 thẻ số liệu dạng phẳng (bỏ gradient từng màu), quick actions dạng list; tiêu đề tiếng Việt có dấu.
- Danh sách/Form project & Settings: dùng `Field`, `Button loading`, thông báo lỗi cạnh field, xác nhận trước thao tác xoá.
- Sửa tiếng Việt không dấu.

### WS5 — QA & xác minh *(sau cùng)*
- Chạy `npm run lint`, `npm test`, `npm run build`.
- Kiểm tra trên trình duyệt ở 375 / 768 / 1024 / 1440px, light + dark: không cuộn ngang, focus ring thấy được, Tab order đúng, menu mobile đóng bằng `Esc`.
- Grep xác nhận: không còn `rounded-[`, `hover:-translate`, chuỗi tiếng Việt không dấu, `href="#"`.
- Ghi log vào `docs/PROJECT_HISTORY.md` §8 và cập nhật `docs/TECHNICAL.md`.

---

## 5. Ngoài phạm vi / rủi ro

- **Không đổi logic nghiệp vụ, schema, server action.** Chỉ UI, copy, layout.
- Tool lọc mic: chỉ thêm focus ring + đổi sang token chung nếu trùng giá trị; không đụng luồng tab/bảng.
- Môi trường local hiện **không kết nối được DB** (`tenant/user … not found`), nên các trang dùng dữ liệu (`/projects`, `/about`, dashboard) chỉ kiểm tra được trạng thái rỗng/lỗi; cần bạn kiểm tra lại với dữ liệu thật trên preview Vercel.
- Di chuyển `app/page.tsx` vào `(public)` không đổi URL.

## 6. Quyết định đã chốt (2026-10-14)

1. **Việt hoá 100%** nhãn UI (kể cả "Dashboard" → "Bảng điều khiển", "Skills" → "Kỹ năng"). Chỉ giữ nguyên tên riêng/thương hiệu (GitHub, ZIP, WakaTime…).
2. Trang chủ đặt **Công cụ trước**, Kho tài liệu sau.
3. **Có nút chuyển sáng/tối thủ công** (Sáng / Tối / Theo hệ thống), lưu lựa chọn trong `localStorage`, không nháy màu khi tải trang. Thuộc WS0 (cơ chế + token) và WS1 (đặt nút trên navbar/sidebar).
