# TECHNICAL — Tài liệu kỹ thuật `my-profile`

> Tài liệu mô tả hệ thống **theo đúng trạng thái code** sau nhóm 1 (`2026-10-02`), nhóm 2 và nhóm 3 (`2026-10-03`) trên nhánh `feat/hardening-and-resources`.
> Nhật ký phát triển và roadmap nằm ở [PROJECT_HISTORY.md](PROJECT_HISTORY.md).

---

## 1. Tổng quan

`my-profile` (brand **Anh coder**) là một web app gồm 3 lớp:

| Lớp | Mục đích | Route chính |
|---|---|---|
| **Public site** | Giới thiệu bản thân, CV, skills có bằng chứng, kho tài liệu, liên hệ | `/`, `/about`, `/cv`, `/skills`, `/projects`, `/contact` |
| **Dashboard** | Admin quản trị profile công khai và kho tài liệu | `/dashboard/**` |
| **Tools** | Công cụ dùng thật, hiện phục vụ công việc cá nhân của chủ site | `/tools/mic-filter`, `/tools/speed-test`, `/tools/ac` |

Quy ước nghiệp vụ đã chốt:

- **"Project" trong code = một mục trong kho tài liệu môn học**, dạng một thư mục được nén ZIP để tải về. Không phải case study portfolio.
- **Chỉ admin được đăng tài liệu.** Viewer chỉ được xem. Quy ước này được chặn ở server action `createProject` (`canCreateProject`) và trang `/dashboard/projects/new` (`requireAdmin`).
- **Tool lọc mic** phục vụ ca trực cá nhân của chủ site và không cần đa người dùng.

---

## 2. Tech stack

| Thành phần | Phiên bản | Vai trò |
|---|---|---|
| Next.js (App Router) | 16.2.1 | Framework, SSR, Server Actions, Route Handlers |
| React | 19.2.4 | UI |
| TypeScript | 5 | Ngôn ngữ |
| Tailwind CSS | v4 (`@tailwindcss/postcss`) | Styling |
| Prisma | 5.21 | ORM, PostgreSQL |
| Supabase | `@supabase/ssr` 0.9, `supabase-js` 2.46 | Auth (email/password), Storage, Postgres |
| Zod | 3.23 | Validate input |
| xlsx | 0.18.5 | Đọc Excel trong tool mic (chạy ở client) |
| jszip | 3.10 | Nén thư mục thành ZIP ở client trước khi upload |
| lucide-react | 0.336 | Icon |
| @cloudflare/speedtest | 1.14.2 (ghim cứng) | Đo tốc độ mạng trong trình duyệt (tool kiểm tra tốc độ mạng) |

Deploy: **Vercel**. Database và storage: **Supabase**.

---

## 3. Cấu trúc thư mục

```
app/
  layout.tsx                    # Root layout: font, lang="vi", script theme chạy trước khi vẽ trang
  (public)/                     # layout (Navbar + Footer), trang chủ, about, cv, skills, contact, projects, projects/[slug], tools/mic-filter, tools/speed-test
  (auth)/                       # layout tối giản, login, register, auth/callback, auth/auth-code-error
  (dashboard)/dashboard/        # layout (requireAuth), page, projects, projects/new, projects/[id]/edit, settings
  api/
    auth/me/                    # GET  user hiện tại
    profile/avatar/             # POST upload avatar (admin)
    projects/[id]/archive/      # POST upload ZIP
    projects/[id]/download/     # GET  tải ZIP
    ac-agent/                   # plan, jobs/[id], events: API cho agent máy lạnh trong LAN
src/
  middleware.ts                 # Rate limit toàn cục, chặn /dashboard, security headers
  actions/                      # Server Actions: auth, projects, profile, contact
  components/
    features/                   # ProfileResume, ProfileSettingsForm, SkillsShowcase, ContactForm
    home/                       # ToolsSection, ResourcesSection, Shortcuts (trang chủ)
    layout/                     # Navbar, NavbarClient, AccountMenu, Footer, Sidebar (+ DashboardMobileNav), SiteLogo, LogoutButton
    projects/                   # ProjectCard, ProjectForm
    tools/                      # MicFilterWorkspace, MicFilterTool, ShiftSummaryPanel, SpeedTestTool
    ui/                         # Button, Field/Input/Select/Textarea, Card, Badge, PageHeader, EmptyState, ErrorState, ThemeToggle, FullscreenLoader
  lib/
    auth/                       # check-auth, permissions, user-record
    db/prisma.ts                # Prisma singleton
    profile/                    # site-profile, resume-content, resume-view
    projects/archive.ts         # slugify, validate ZIP, formatFileSize
    projects/archive-manifest.ts # đọc danh sách file trong ZIP (preview)
    projects/resource.ts        # tag, bộ lọc, sort của kho tài liệu
    security/                   # rate-limit (in-memory), request (lấy IP)
    skills/                     # data.ts (tổng hợp skills), types.ts
    storage/                    # project-archives, profile-avatar (Supabase Storage)
    supabase/                   # client/server Supabase clients
    validators/                 # Zod schemas
    utils/constants.ts          # SITE_NAME, NAV_LINKS, ADMIN_NAV_LINKS
  tools/mic-filter/             # Logic thuần của tool mic:
                                #   processor, alarm, types
                                #   config (cấu hình + schema)
                                #   constants (giá trị mặc định)
                                #   session (localStorage)
                                #   export (bảng trưa cho ảnh)
  tools/ac-scheduler/           # Logic thuần của tool máy lạnh: parser, plan (quy tắc), units (CSV), config, view
  tools/speed-test/             # Logic thuần của tool tốc độ mạng:
                                #   config (danh sách phép đo, giới hạn dữ liệu)
                                #   format (Mbps, ms), quality (đánh giá, văn bản sao chép)
  lib/tools/mic-filter-settings.ts # Đọc cấu hình tool mic từ DB (server-only)
  lib/tools/ac-scheduler.ts     # Cấu hình, quyền, log, token agent của tool máy lạnh (server-only)
  types/index.ts                # Kiểu dùng chung
prisma/
  schema.prisma, seed.ts
scripts/grant-admin.sql         # Gán role admin thủ công
scripts/backfill-archive-manifests.ts # Sinh preview ZIP cho archive cũ
```

Quy ước:

- Logic nghiệp vụ thuần nằm ở `src/lib/*` và `src/tools/*`, không phụ thuộc React.
- File chỉ chạy trên server có `import "server-only"`, gồm `check-auth`, `user-record` và `site-profile`.
- Ghi dữ liệu đi qua **Server Actions** (`src/actions`). Upload và download file đi qua **Route Handlers** (`app/api`) vì cần `FormData` lớn hoặc cần trả về stream.

---

## 4. Kiến trúc & luồng request

```
Browser
  │
  ▼
middleware.ts ── rate limit 120 req/phút/IP (block 5 phút)
  │             ── POST /login|/register: 12 req/10 phút/IP
  │             ── refresh session Supabase (cookie)
  │             ── /dashboard/* chưa login → /login; đã login vào /login|/register → /dashboard
  │             ── gắn security headers (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP, HSTS khi https)
  ▼
App Router
  ├─ Server Components ──► lib/* ──► Prisma ──► Postgres (Supabase)
  ├─ Server Actions ─────► Zod validate ─► check quyền ─► Prisma ─► revalidatePath
  └─ Route Handlers ─────► check quyền ─► Supabase Storage (service role key)
```

Tất cả trang đọc DB đều khai báo `export const dynamic = "force-dynamic"`, gồm about, skills, projects và dashboard. Mục đích là tránh việc build gọi `cookies()` hoặc truy cập DB lúc build.

---

## 5. Database

Schema: [prisma/schema.prisma](../prisma/schema.prisma). Provider PostgreSQL, dùng `DATABASE_URL` (pooler, pgbouncer) và `DIRECT_URL` (cho migrate).

```
User 1─1 Profile
User 1─n UserRole n─1 Role            (role: "viewer", "admin")
User 1─n Project 1─n ProjectFile      (thực tế mỗi project giữ đúng 1 file ZIP mới nhất)
Project 1─n ProjectPermission n─1 User (VIEW | EDIT, dùng khi visibility = SHARED)
User 0..1─n ContactMessage
```

| Bảng | Ghi chú |
|---|---|
| `users` | `id` **trùng với Supabase auth user id**, không dùng cuid. Được upsert bởi `syncAuthUserRecord`. |
| `profiles` | Profile công khai. Trường `bio` lưu **JSON có version**: `{version, summary, currentFocus, strengths[], highlights[]}` (xem `resume-content.ts`). Nếu bio không phải JSON thì cả chuỗi được coi là `summary`. |
| `roles`, `user_roles` | Role theo tên. Thứ tự ưu tiên: `admin > viewer > guest`. |
| `projects` | `status` có các giá trị DRAFT/PUBLISHED/ARCHIVED. `visibility` có các giá trị PUBLIC/PRIVATE/SHARED. `subjectName` là **môn học** và `semester` là **kỳ học**, dùng để lọc. `techStack` lưu **tag** dạng chuỗi chuẩn hoá `"A, B"`; tên cột giữ nguyên để không phải migrate. `publishedAt` được set ở lần đầu chuyển sang PUBLISHED. `downloadCount` là số lượt tải. |
| `project_files` | `filePath` là path trong bucket Supabase. `entries` (JSONB, có thể null) lưu `ArchiveManifest`: `{version: 1, totalFiles, totalUncompressedBytes, entries: [{path, sizeBytes}], truncated}`, tối đa 500 entry. Khi upload mới, các bản ghi cũ bị xoá và file cũ bị xoá khỏi storage. |
| `project_permissions` | Unique `(projectId, userId)`. Đã có schema và logic server nhưng **chưa có UI**. |
| `contact_messages` | Có `isRead` nhưng **chưa có UI đọc**. |
| `tool_settings` | Key/value JSON cho các tool. Key `mic-filter` lưu `MicFilterConfig`. Không có hàng nào thì tool dùng mặc định trong code. |

Migrations nằm trong `prisma/migrations`:

| Migration | Nội dung |
|---|---|
| `0_init` | Baseline toàn bộ schema (DB cũ cần `migrate resolve --applied`, xem §8.2.1) |
| `20261002000000_resource_downloads_and_manifest` | Thêm `projects.downloadCount` và `project_files.entries` |
| `20261003000000_tool_settings` | Tạo bảng `tool_settings` |

---

## 6. Auth & phân quyền

### 6.1. Đăng ký và đăng nhập (`src/actions/auth.ts`)

- **Login:** Zod validate, kiểm tra honeypot `website`, áp rate limit 5 lần/10 phút/IP, gọi `signInWithPassword`, rồi `syncAuthUserRecord`. Nếu bước sync lỗi thì `signOut` để rollback và báo lỗi cấu hình. Đăng nhập thành công thì redirect về `/dashboard`.
- **Register:** áp rate limit 3 lần/30 phút/IP. Tài khoản được tạo bằng **service role** `auth.admin.createUser({ email_confirm: true })`, tức là **bỏ qua bước xác nhận email**. Sau đó hệ thống sync user rồi tự đăng nhập.
- **Callback** `/auth/callback`: gọi `exchangeCodeForSession(code)` rồi redirect tới `next`. `next` đi qua `getSafeRedirectPath` (`src/lib/security/redirect.ts`), chỉ chấp nhận path nội bộ, nếu không hợp lệ thì về `/dashboard`. Route này dành cho magic link/OAuth nếu bật sau này.
- Mọi thông báo lỗi đều là thông báo chung, để không lộ việc email có tồn tại hay không.

### 6.2. Đồng bộ user (`src/lib/auth/user-record.ts`)

`syncAuthUserRecord({userId, email})` chạy trong một transaction:

1. Upsert role `viewer`. Nếu email nằm trong `ADMIN_EMAILS` thì upsert thêm role `admin`.
2. Upsert `users` và `profiles`.
3. Gán role, dùng `skipDuplicates`.

`getCurrentUser()` được bọc trong React `cache` nên chỉ chạy một lần mỗi request. Nó sync lại khi gặp một trong các trường hợp: chưa có user/profile, email đổi, chưa có role, hoặc email nằm trong `ADMIN_EMAILS` nhưng chưa có role admin.

**Cách cấp quyền admin:** thêm email vào `ADMIN_EMAILS` (phân tách bằng dấu phẩy) rồi đăng nhập lại. Cách khác là chạy `scripts/grant-admin.sql`.

### 6.3. Guard

| Guard | Ở đâu | Hành vi |
|---|---|---|
| `middleware` | `/dashboard/*` | Chưa login thì chuyển về `/login` |
| `requireAuth()` | Dashboard layout, projects, edit | Chưa login thì chuyển về `/login` |
| `requireAdmin()` | `/dashboard/settings`, `/dashboard/projects/new` | Không phải admin thì chuyển về `/about` |
| check thủ công trong action/route | `updateProfile`, `createProject`, `/api/profile/avatar` | Không phải admin thì trả lỗi Forbidden |

### 6.4. Ma trận quyền project (`src/lib/auth/permissions.ts`)

| Hành động | Tác giả | Admin | Share EDIT | Share VIEW | Khách |
|---|---|---|---|---|---|
| Xem/tải PUBLIC | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xem/tải SHARED | ✅ | ✅ | ✅ | ✅ | ❌ |
| Xem/tải PRIVATE | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sửa / publish / upload ZIP | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xoá, đổi visibility, quản lý share | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Tạo mới** | ❌ (trừ khi là admin) | ✅ | ❌ | ❌ | ❌ |

> Tài liệu do viewer tạo **trước** đợt sửa ngày 2026-10-02 vẫn tồn tại và tác giả vẫn sửa được. Admin nên rà lại danh sách trong `/dashboard/projects`.

---

## 7. Các module chức năng

### 7.1. Profile công khai (`/about`, `/cv`, `/dashboard/settings`)

- `getSiteProfile()` lấy profile của user có role `admin`, ưu tiên bản `updatedAt` mới nhất. Nếu không có thì lấy profile bất kỳ.
- `buildResumeViewModel()` dựng view model. Trường nào trống thì dùng giá trị mặc định có sẵn trong `resume-view.ts` (hiện là tiếng Việt **không dấu**).
- `ProfileSettingsForm` gọi `updateProfile` (server action) và `POST /api/profile/avatar`.
- Avatar được lưu vào bucket **`profile-images`** (public) tại path `avatars/{userId}/{timestamp}.{ext}`. Avatar cũ bị xoá sau khi upload xong. Các định dạng được nhận là JPEG, PNG, WebP và GIF, tối đa bằng `NEXT_PUBLIC_MAX_FILE_SIZE`.
- Bucket được tạo tự động lần đầu (`ensureProfileAvatarBucket`).

### 7.2. Kho tài liệu (`/projects`, `/dashboard/projects`)

Chỉ admin được tạo tài liệu (xem §6.4).

**Luồng tạo hoặc cập nhật** (`ProjectForm`):

1. Admin nhập các trường:
   - tên tài liệu (≥ 5 ký tự)
   - **môn học**, **kỳ học** (bắt buộc)
   - **mô tả ngắn** (10–500 ký tự)
   - **ghi chú chi tiết** (không bắt buộc)
   - **tag** (phân tách bằng dấu phẩy)
   - **trạng thái**: Công khai hoặc Nháp

   Sau đó chọn thư mục (`webkitdirectory`).
2. Client dựng payload với `slug = slugify(title)` và `visibility=PUBLIC`. Tag được chuẩn hoá bởi `serializeResourceTags`: bỏ trùng không phân biệt hoa thường, tối đa 20 tag, mỗi tag ≤ 40 ký tự. Chuỗi placeholder cũ `"ZIP archive, Downloadable resources"` được coi là không có tag.
3. Gọi `createProject` hoặc `updateProject`. Slug được làm unique bằng cách thêm hậu tố `-2`, `-3`, ... Khi sửa slug, project hiện tại được loại khỏi phép kiểm tra trùng. `publishedAt` được set ở lần đầu chuyển sang PUBLISHED.
4. Client nén thư mục bằng JSZip (DEFLATE level 6), kiểm tra kích thước (mặc định ≤ 50MB, chỉnh qua `NEXT_PUBLIC_PROJECT_ARCHIVE_MAX_SIZE`).
5. Gửi `POST /api/projects/{id}/archive`. Server làm các bước sau:
   - chạy `buildArchiveManifest`, vừa để kiểm tra đây đúng là ZIP đọc được, vừa để lấy danh sách file
   - upload vào bucket **`portfolio-files`** (private) tại `project-archives/{projectId}/{timestamp}-{slug}.zip`
   - trong một transaction, thay bản ghi `project_files` cũ bằng bản mới (kèm `entries`), rồi xoá file cũ khỏi storage

   Nếu ghi DB lỗi thì file vừa upload bị xoá để rollback.

**Trang `/projects`:** dùng form GET, không cần JS phía client. Các tham số query:

| Param | Ý nghĩa |
|---|---|
| `q` | Tìm không phân biệt hoa thường trong tên, mô tả ngắn, môn học, tag |
| `subject` | Lọc đúng môn học (danh sách lấy từ `groupBy`, kèm số lượng) |
| `semester` | Lọc đúng kỳ học |
| `sort` | `newest` (mặc định, theo `publishedAt` rồi `createdAt`), `downloads`, `title` |

Tham số được đọc qua `parseResourceFilters`: trim, cắt còn 120 ký tự, `sort` sai thì về `newest`. Chỉ lấy các tài liệu `PUBLIC` + `PUBLISHED` **và có ít nhất 1 file**.

**Trang chi tiết `/projects/[slug]`:** hiện môn học, kỳ học, lượt tải, ghi chú và tag. Phần **"Bên trong file ZIP"** (`ArchiveContents`) vẽ cây thư mục từ `entries` bằng `<details>`. Archive upload trước khi có tính năng này sẽ không có preview cho tới khi chạy `npm run archives:backfill` hoặc upload lại. Tài liệu **không ở trạng thái PUBLISHED** chỉ tác giả và admin xem được; người khác nhận 404.

**Download:** `GET /api/projects/{id}/download` kiểm tra lần lượt:

1. Trạng thái: chưa PUBLISHED mà không phải tác giả/admin thì trả 404.
2. Visibility.

Qua kiểm tra thì route tải blob từ storage qua service role, **tăng `downloadCount`** (không tính tác giả và admin; lỗi đếm không chặn việc tải), rồi trả file với `Content-Disposition` hỗ trợ tên UTF-8 và `Cache-Control: private, no-store`.

**Dashboard `/dashboard/projects`:** hiện môn học, kỳ học, lượt tải từng tài liệu và tổng lượt tải.

**Xoá:** xoá file trong storage trước (lỗi chỉ được log, không chặn), sau đó xoá bản ghi. Quan hệ cascade sẽ xoá `files` và `permissions` theo.

Giới hạn body: `serverActions.bodySizeLimit = 10mb`, `proxyClientMaxBodySize = 50mb` (`next.config.ts`).

### 7.3. Skills (`/skills`, `src/lib/skills/data.ts`)

`getSkillsPageData(profile)` gom 3 nguồn song song bằng `Promise.allSettled`, nên một nguồn lỗi không làm hỏng cả trang:

| Nguồn | Cấu hình | Cache | Dữ liệu |
|---|---|---|---|
| GitHub | `GITHUB_USERNAME` hoặc lấy từ `profile.githubUrl`; `GITHUB_TOKEN` tuỳ chọn; `SKILLS_GITHUB_REPO_LIMIT` | `revalidate` 6h | Repo, ngôn ngữ chính, topics, dependency trong `package.json` |
| Project archive | DB | Không cache | Đọc **tag** (`techStack`) của tối đa 24 tài liệu public. Chỉ tag khớp `TECH_DEFINITIONS` mới thành skill, ví dụ "Java" thì có, "Đề thi" thì không. |
| WakaTime | `WAKATIME_API_KEY` | `revalidate` 1h | Ngôn ngữ, editor, OS trong 7 và 30 ngày gần nhất |

Mỗi token được chuẩn hoá qua `TECH_DEFINITIONS` (alias → tên chuẩn + category). Sau đó hệ thống gộp thành `SkillTechCard`, gồm usage %, số project, nhãn nguồn và danh sách project làm bằng chứng. UI `SkillsShowcase` hỗ trợ lọc theo nhóm và sort theo usage, số project, độ mới và alphabet.

Mỗi nguồn có trạng thái `ready | needs-config | empty | error` để hiển thị trên UI.

> Tài liệu tạo trước `2026-10-03` vẫn mang tag placeholder cũ. Cần sửa lại tag trong dashboard thì nguồn này mới có dữ liệu.

### 7.4. Tool lọc mic (`/tools/mic-filter`)

Việc xử lý file chạy **ở client** và không cần đăng nhập. Server chỉ đọc cấu hình (xem mục **Cấu hình** bên dưới) rồi truyền xuống cho client.

**Input:** file `.xls` hoặc `.xlsx`. Tool chỉ đọc **sheet đầu tiên**, dòng 1 là header. Tên cột được so khớp sau khi trim, gộp khoảng trắng và chuyển về chữ thường. **Dấu tiếng Việt vẫn phải đúng.** Riêng phần ghi chú thì được bỏ dấu trước khi tìm từ khoá.

| Cột | Bắt buộc |
|---|---|
| Mã phòng | ✅ |
| Thời gian bắt đầu | ✅ |
| Thời gian kết thúc | ✅ |
| Ghi chú | ✅ |
| Ngày học | Không (chỉ dùng để hiển thị nhãn ngày nếu cả file có đúng 1 ngày) |

**Xử lý** (`processMicFilterFile(file, config)` trong `src/tools/mic-filter/processor.ts`):

1. Parse từng dòng và bỏ dòng trống. Dòng nào thiếu mã phòng, sai giờ, hoặc có giờ bắt đầu ≥ giờ kết thúc sẽ **gây lỗi cho cả file** (thông báo kèm số dòng).
2. Nếu ghi chú chứa "đã báo nghỉ" hoặc "không phát mic", dòng đó được đánh dấu `isIgnoredForMic`.
3. Mỗi dòng được xác định thuộc ca nào theo `config.shifts`. Mặc định là sáng 07:30–11:35, chiều 12:30–16:35, tối 18:00–20:15. Một dòng có thể chồng lên nhiều ca.
4. Chỉ giữ các phòng có trong `config.wirelessRooms`. Kết quả được gộp theo phòng.
5. Tool sinh ra 2 bảng:
   - **Bảng 1, soạn mic ca sáng:** các phòng dùng ca sáng, nhóm theo tầng.
   - **Bảng 2, buổi trưa:** mỗi tầng chia thành 3 nhóm:
     - sáng có, chiều không → **thu**
     - sáng không, chiều có → **phát**
     - cả sáng và chiều → **thay pin**
6. **Nhắc bật máy lạnh** (`alarm.ts`) lấy rule từ `config.alarmRules`. Mặc định có 2 rule:
   - có lớp bắt đầu đúng 9h20 → nhắc lúc 9h
   - có lớp bắt đầu trong khoảng 15h–16h → nhắc lúc 15h

   Rule nhắc áp dụng cho **mọi phòng**, không chỉ phòng có mic không dây. Câu gợi ý và nhãn giờ được sinh tự động bởi `describeAlarmRule`. Gợi ý chỉ hiện trong khung "hiện gợi ý" của rule. Tool dùng `setTimeout` và Browser Notification API, nên **tab phải luôn mở** thì mới nhận được thông báo.

**Giao diện** (`MicFilterTool`, từ `2026-10-03`): nền sáng, chữ gần đen, font Be Vietnam Pro + JetBrains Mono (nạp bằng `next/font` trong `page.tsx`). Màu nằm trong các biến `--mic-*` ở `app/globals.css`, có bản sáng và tối, dùng qua class Tailwind `bg-mic-*`, `text-mic-*`. Mỗi việc một màu: xanh dương = soạn mic sáng, cam = thu/phát/thay pin, xanh lá = kết ca. Trang có 2 tab:

- **Lọc mic:** chưa có file thì chỉ hiện ô kéo-thả. Có file rồi thì hiện 2 bảng chỉ xem, ô phòng chỉ ghi số phòng vì đã có cột Tầng:
  - **Soạn mic ca sáng:** không có nút copy.
  - **Thu · Phát · Thay pin:** có một nút **Copy ảnh**. Phía trên bảng có một dòng riêng cho mỗi báo thức máy lạnh: nút "Đặt báo thức" khi đang trong khung gợi ý, "Đặt được từ HH:MM" khi chưa tới khung, và dòng này ẩn khi đã qua khung.
  - Tên file và nút **Đổi file** nằm ở đầu trang.
- **Kết ca:** form bên trái gồm ca, ngày, 4 bộ đếm, danh sách phản hồi phòng học và vật tư cho mượn (thêm hoặc xoá từng dòng). Bên phải là tờ **Báo cáo kết ca** luôn nền trắng chữ đen. Nút **Xuất PDF** gọi `window.print()`. Khi in, CSS `@media print` trong `globals.css` chỉ giữ lại `.mic-print-sheet` và đặt khổ A4. Tên file PDF gợi ý là `ket-ca-sang-dd-mm-yyyy`.

Đã bỏ: checklist tick từng phòng, Copy chữ, các ô số liệu tổng và khối thông tin file.

**Xuất ảnh** (`export.ts` → `buildMiddayExportTable`, `components/tools/table-image.ts`): vẽ bảng trưa ra PNG bằng canvas, độ phân giải 2x, không dùng thư viện ngoài. Ảnh được copy vào clipboard. Nếu trình duyệt không cho copy ảnh thì ảnh được tải về dưới dạng file PNG.

**Giữ phiên làm việc** (`session.ts`): localStorage key `mic-filter:session:v1` lưu báo cáo đã lọc và form kết ca, kèm `dayKey`. Trường `checked` của phiên cũ bị bỏ qua khi đọc.

- Trạng thái được khôi phục sau khi mount.
- Dữ liệu của ngày khác bị bỏ.
- Nếu tab mở qua đêm, tool tự reset khi sang ngày mới.
- Dữ liệu hỏng thì được vá hoặc bỏ qua.
- Đọc/ghi localStorage lỗi (chế độ riêng tư) không làm hỏng tool.

Báo thức đã đặt **không** được khôi phục, nên sau khi reload cần đặt lại.

**Cấu hình** (`config.ts`, bảng `tool_settings`, trang `/dashboard/tools/mic-filter` chỉ dành cho admin):

- `MicFilterConfig = { version: 1, wirelessRooms, shifts: {morning, afternoon, evening}, alarmRules }`. Giờ được lưu bằng số phút tính từ 0h.
- Schema `micFilterConfigSchema` kiểm tra các điều kiện sau:
  - mã phòng có dạng `E1-05.07`, được chuẩn hoá viết hoa và bỏ trùng; cần 1–500 phòng
  - giờ bắt đầu ca phải trước giờ kết thúc
  - khung giờ của rule nhắc không bị ngược
  - id rule không trùng; tối đa 20 rule
- `getMicFilterConfig()` **không bao giờ throw**. Khi chưa có hàng nào, dữ liệu hỏng hoặc DB lỗi, hàm trả về `DEFAULT_MIC_FILTER_CONFIG` (lấy từ `constants.ts`), để tool vẫn dùng được mỗi ca.
- Server action `saveMicFilterConfig` (upsert) và `resetMicFilterConfig` (xoá hàng để về mặc định) chỉ cho admin, và revalidate trang tool.
- Form admin cho sửa danh sách phòng (mỗi dòng một phòng), giờ 3 ca và rule nhắc (thêm/xoá, xem trước câu gợi ý).
- Sidebar dashboard chỉ hiện link "Tool lọc mic" và "Cài đặt" với admin (`adminOnly` trong `ADMIN_NAV_LINKS`).

`constants.ts` giờ chỉ là **giá trị mặc định**. Khi đã lưu cấu hình trong dashboard, sửa `constants.ts` không còn tác dụng cho tới khi bấm "Về mặc định".

### 7.5. Liên hệ (`/contact`)

`ContactForm` gọi `submitContactMessage`, gồm các bước:

1. Zod validate: trim, chuẩn hoá email về chữ thường, giới hạn độ dài.
2. **Honeypot** `website`: nếu bị điền thì trả `success: true` giả và không ghi DB.
3. **Rate limit theo IP** (in-memory): 3 tin/10 phút, vượt thì khoá 30 phút.
4. **Rate limit theo email** (đếm trong DB, nên vẫn đúng trên serverless): tối đa 3 tin/giờ.
5. Ghi vào `contact_messages`, kèm `userId` nếu người gửi đã đăng nhập.

Form hiển thị lỗi từ server và thông báo khi gửi thành công. Hiện vẫn **chưa có thông báo** cho admin và **chưa có UI đọc tin**.

### 7.6. Hệ thống giao diện (từ `2026-10-14`)

- **Token màu** trong `app/globals.css`, dùng qua class Tailwind: nền `canvas`/`surface`/`sunken`, chữ `ink`/`muted`, viền `line`/`line-strong`, màu nhấn `accent` (`#2457D6`, trùng `--mic-primary`), trạng thái `success`/`warn`/`danger` (+ `-soft`). Các biến `--mic-*` vẫn giữ cho tool lọc mic.
- **Sáng/tối thủ công**: `dark:` theo thuộc tính `data-theme` trên `<html>` (`@custom-variant dark`), không theo media query. Script trong `<head>` của `app/layout.tsx` đọc `localStorage["theme"]` (`light`/`dark`/`system`) và gắn `data-theme` trước khi vẽ trang. Logic nằm ở `src/lib/theme/theme.ts`; nút chọn là `ThemeToggle` (navbar, menu mobile, sidebar, trang auth).
- **Font**: Be Vietnam Pro + JetBrains Mono nạp bằng `next/font` ở root layout.
- **A11y chung**: viền `:focus-visible` cho mọi phần tử tương tác, tắt hiệu ứng khi `prefers-reduced-motion`, link "Bỏ qua tới nội dung" ở layout public, mỗi trang một `h1` (qua `PageHeader`).
- **Quy ước**: chỉ dùng `rounded-lg|xl|2xl|full`, `shadow-sm|md`; hover chỉ đổi màu, không dịch chuyển; toàn bộ chữ UI là tiếng Việt có dấu.
- **Layout**: `Navbar`/`Footer` chỉ có ở `(public)`. Dashboard chỉ có `Sidebar` (desktop) và `DashboardMobileNav` (mobile). `Footer` đọc liên hệ thật từ `getSiteProfile()` và tự ẩn khi DB lỗi.
- Trang Kỹ năng không in lỗi thô của nguồn dữ liệu ra trang; lỗi gốc ghi bằng `console.error` phía server.

### 7.7. Kiểm tra tốc độ mạng (`/tools/speed-test`, từ `2026-10-14`)

Công cụ công khai, không cần đăng nhập. Spec: `docs/superpowers/specs/2026-10-14-speed-test-design.md`.

- **Đo trong trình duyệt** bằng `@cloudflare/speedtest` (tải bằng `import()` khi bấm "Bắt đầu đo"), gọi thẳng `speed.cloudflare.com/__down` và `__up`. Không qua server Next.js, không ghi DB.
- **Không lưu kết quả**: `ENGINE_OPTIONS.logAimApiUrl = null` (mặc định thư viện gửi kết quả về `speed.cloudflare.com/__results`).
- **Giới hạn dữ liệu** (`src/tools/speed-test/config.ts`): bỏ các lượt 50/100/250 MB của cấu hình mặc định; tối đa ≈ 99 MB tải xuống + 47 MB tải lên. Mạng chậm dùng ít hơn vì thư viện dừng tăng kích thước khi một lượt ≥ 1 giây.
- **Không đo mất gói** (cần TURN server riêng). Thư viện tính mất gói chưa đo là 0 điểm AIM, nên `rescoreAssumingNoPacketLoss()` cộng lại 10 điểm và xếp loại lại theo ngưỡng của thư viện; giao diện ghi rõ giả định này. **Khi nâng cấp thư viện phải kiểm tra lại ngưỡng** trong `quality.ts`.
- **Giao diện** (`SpeedTestTool`): trạng thái `idle → loading → running ⇄ paused → done | error`; 4 ô Tải xuống / Tải lên / Ping / Độ dao động cập nhật trực tiếp; đánh giá Xem video / Chơi game / Gọi video (Tốt / Khá / Kém); Đo lại dùng `restart()` trên cùng một engine; rời trang thì `pause()`; vùng `aria-live` chỉ báo khi một hạng mục đo xong.

### 7.8. Máy lạnh theo lịch (`/tools/ac`, từ `2026-10-19`)

Bật máy lạnh **toà E1** theo file lịch học hằng ngày: bật trước giờ học `leadMinutes` (20) phút, tắt đúng giờ kết thúc. Web chỉ lập kế hoạch; **agent Python trong LAN trường** (`agent/ac-agent/`, xem README ở đó) mới điều khiển iTM, vì Vercel không gọi được `192.168.91.x`.

**Luồng:** người có quyền chọn file → trình duyệt đọc file (`readAcScheduleFile`) và xem trước (`buildAcPlan`) → bấm **Kích hoạt** gửi các dòng (không gửi file) cho `activateAcSchedule` → server tính lại kế hoạch bằng giờ server và danh sách máy trong DB → tạo `ac_jobs` (mỗi khung 1 lệnh ON + 1 lệnh OFF) → agent hỏi `/api/ac-agent/plan` mỗi 30s → "nhận" lệnh (`RUNNING`, compare-and-set) → gửi iTM → báo `DONE/SKIPPED/FAILED` → `ac_events` → trang cập nhật qua Supabase Realtime.

**Quy tắc** (`src/tools/ac-scheduler/plan.ts`; agent có bản Python giống hệt cho phần bật trễ):

- file phải đủ cột Mã phòng, Ngày học, Thời gian bắt đầu, Thời gian kết thúc, Ghi chú; mọi dòng cùng **một ngày = hôm nay** (UTC+7), không thì từ chối cả file
- chỉ dòng `E1-xx.yy(/n)`; dòng E1 sai giờ, giờ ngược hoặc ngoài 06:00–22:00 → từ chối cả file
- ghi chú chứa "bao nghi" (bỏ dấu) → bỏ dòng đó; ghi chú lạ khác → cảnh báo vàng, vẫn chạy; "khong phat mic" không ảnh hưởng
- phòng không có máy trong `ac_units.roomCodes` → không bật (vd sân bóng chuyền `E1-12.01/*`)
- ca của cùng **một máy** cách nhau ≤ `leadMinutes` được gộp, máy chạy liên tục
- quá `maxConcurrentUnits` máy chạy cùng lúc → cần tick xác nhận
- `classifyTurnOn`: chưa tới giờ bật → chờ; trễ nhưng còn ≥ `minRemainingMinutes` → bật ngay; còn ít hơn → bỏ qua (lệnh tạo sẵn ở trạng thái `SKIPPED`)
- kích hoạt lại cùng ngày: lịch cũ `SUPERSEDED`, lệnh chờ bị huỷ, **trừ lệnh tắt của máy đã bật** (chuyển sang lịch mới, hoặc huỷ nếu lịch mới vẫn dùng máy lúc đó). Huỷ lịch cũng giữ các lệnh tắt này

**Cấu hình** (`tool_settings` key `ac-scheduler`, `acSchedulerConfigSchema`): `leadMinutes`, `minRemainingMinutes`, `maxConcurrentUnits`, `paused` (dừng khẩn cấp), `dryRun` (**mặc định bật**: agent chỉ ghi log). Đọc lỗi → trả về cấu hình mặc định với `paused: true`.

**Quyền:** mọi user đăng nhập xem trang/log (RLS `SELECT` cho `authenticated`). Nhập, kích hoạt, huỷ, dừng khẩn cấp cần admin hoặc role `ac_operator` (`canOperateAc`). Bật lại sau dừng khẩn cấp, cấu hình, danh sách máy, cấp quyền, token agent: chỉ admin (`/dashboard/tools/ac`).

**API cho agent** (`Authorization: Bearer <token>`, `ac_agents.tokenHash` = SHA-256):

| Route | Việc |
|---|---|
| `GET /api/ac-agent/plan` | lệnh `PENDING/RUNNING` của hôm nay (máy đang bật), cấu hình, giờ server; cập nhật `lastSeenAt` (agent "online" nếu < 90s) |
| `POST /api/ac-agent/jobs/[id]` | đổi trạng thái theo bảng chuyển hợp lệ; `RUNNING` bị từ chối (409) khi đang dừng, khác ngày, máy bị tắt; có `isRunning` thì cập nhật `ac_units` |
| `POST /api/ac-agent/events` | log tự do của agent |

**Bảng:** `ac_units` (ip, tầng iTM, `unitIndex`, tên, `roomCodes`, trạng thái cuối), `ac_schedules`, `ac_jobs`, `ac_events`, `ac_agents`. Migration `20261019000000_ac_scheduler` bật RLS cho cả 5 bảng và thêm `ac_units`, `ac_jobs`, `ac_events` vào publication `supabase_realtime`.

---

## 8. Cài đặt & vận hành

### 8.1. Biến môi trường

Prisma CLI đọc từ `.env.local` qua `dotenv-cli`. Next.js đọc `.env.local` và `.env`.

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooler Supabase (port 6543, `pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | ✅ | Kết nối trực tiếp (port 5432) cho migrate |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Dùng cho register và storage. **Chỉ dùng ở server.** |
| `ADMIN_EMAILS` | ✅ | Danh sách email admin, phân tách bằng dấu phẩy |
| `NEXT_PUBLIC_APP_URL` | | URL của app |
| `NEXT_PUBLIC_STORAGE_BUCKET` | | Mặc định `portfolio-files` |
| `NEXT_PUBLIC_PROFILE_AVATAR_BUCKET` | | Mặc định `profile-images` |
| `NEXT_PUBLIC_MAX_FILE_SIZE` | | Mặc định 10MB (avatar, Excel) |
| `NEXT_PUBLIC_PROJECT_ARCHIVE_MAX_SIZE` | | Mặc định 50MB |
| `GITHUB_USERNAME`, `GITHUB_TOKEN`, `SKILLS_GITHUB_REPO_LIMIT` | | Nguồn skills từ GitHub |
| `WAKATIME_API_KEY` | | Nguồn skills từ WakaTime |

### 8.2. Chạy local

```bash
npm install
```

```bash
npm run prisma:deploy
```

```bash
npm run prisma:seed
```

```bash
npm run dev
```

Sau khi seed, đăng ký tài khoản bằng email có trong `ADMIN_EMAILS` để nhận quyền admin.

Khi sửa `schema.prisma`, dùng `npm run prisma:migrate` để tạo migration mới và commit thư mục `prisma/migrations`.

### 8.2.1. Baseline migration cho DB đã có sẵn

`prisma/migrations/0_init` được sinh từ schema hiện tại (`prisma migrate diff --from-empty`). Với DB production **đã có bảng từ trước**, chỉ cần đánh dấu migration này là đã chạy, **không chạy lại SQL**:

```bash
npx dotenv -e .env.local -- prisma migrate resolve --applied 0_init
```

Sau bước đó, `prisma migrate deploy` hoạt động bình thường cho các migration sau.

**Thứ tự triển khai nhánh `feat/hardening-and-resources` lên production. Phải làm trước khi deploy code**, vì code mới đọc `downloadCount` và `entries`:

1. Kiểm tra DB khớp baseline. Lệnh sau chỉ được in ra 2 câu `ALTER TABLE` (migration `20261002000000_...`) và 1 câu `CREATE TABLE "tool_settings"` (migration `20261003000000_...`):
   ```bash
   npx dotenv -e .env.local -- prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script
   ```
2. Đánh dấu baseline đã chạy:
   ```bash
   npx dotenv -e .env.local -- prisma migrate resolve --applied 0_init
   ```
3. Áp dụng migration mới:
   ```bash
   npm run prisma:deploy
   ```
4. Deploy code (merge vào `main`).
5. Tuỳ chọn: sinh preview cho archive cũ:
   ```bash
   npm run archives:backfill
   ```

### 8.3. Scripts

| Script | Tác dụng |
|---|---|
| `dev` / `start` | Chạy dev server / production server |
| `build` | `prisma generate && next build` |
| `postinstall` | `prisma generate` (để Vercel có Prisma Client) |
| `lint` | ESLint |
| `test` | Unit test bằng `node:test` + `tsx` (file `src/**/__tests__/*.test.ts`) |
| `archives:backfill` | Sinh `entries` cho các archive cũ (thêm `-- --dry-run` để chạy thử) |
| `prisma:migrate` / `prisma:deploy` / `prisma:seed` | Migrate dev / deploy / seed role |

### 8.4. Deploy (Vercel)

- Khai báo đủ env ở §8.1 trên Vercel.
- Trong Supabase Auth, thêm domain production vào **Site URL** và **Redirect URLs**.
- Hai bucket storage sẽ tự tạo ở lần upload đầu tiên. Có thể tạo trước: `portfolio-files` (private) và `profile-images` (public).

---

## 9. Vấn đề đã biết & tech debt

### 9.1. Lỗi / lệch so với ý đồ

> Đã sửa ngày 2026-10-02: viewer tạo được tài liệu, open redirect ở callback, form liên hệ thiếu chống spam. Đã sửa ngày 2026-10-03: `publishedAt` không được set, slug trùng khi update, tag/môn/kỳ bị ghi đè bằng template. Chi tiết ở PROJECT_HISTORY §8.

| # | Vấn đề | Vị trí | Mức |
|---|---|---|---|
| 3 | **Rate limit lưu trong bộ nhớ** (`Map` trên `globalThis`). Trên Vercel serverless, mỗi instance có bộ đếm riêng nên giới hạn gần như không có tác dụng. | `src/lib/security/rate-limit.ts` | 🟠 Trung bình |
| 8 | Text mặc định trong `resume-view.ts`, dashboard layout và avatar route là tiếng Việt **không dấu**. | nhiều file | 🟡 Thấp |
| 9 | `middleware.ts` đã bị đổi tên thành `proxy.ts` từ Next 16 (tên cũ vẫn chạy nhưng là deprecated). | `src/middleware.ts` | 🟡 Thấp |

### 9.2. Vận hành / hạ tầng

- DB Supabase đã được baseline và chạy đủ 3 migration ngày `2026-10-03`. Từ nay chỉ cần `npm run prisma:deploy` **trước khi** deploy code có migration mới.
- Mới có unit test cho logic thuần: mic-filter, quyền project, redirect. Chưa có integration test (server actions + DB) và e2e.
- Chưa có CI chạy `lint`, `test`, `build`.
- Đăng ký `/register` vẫn mở cho mọi người, dù viewer hiện không làm được gì thêm ngoài xem. Có thể cân nhắc tắt.

### 9.3. Model dữ liệu chưa có UI

- `ProjectPermission`: có logic share VIEW/EDIT nhưng form luôn gửi `sharedUsers: []`.
- `ContactMessage`: chưa có trang đọc và đánh dấu đã đọc.
- Chưa có trang quản lý user và role.
