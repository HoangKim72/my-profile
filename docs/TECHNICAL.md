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
| **Tools** | Công cụ dùng thật, hiện phục vụ công việc cá nhân của chủ site | `/tools/mic-filter` |

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

Deploy: **Vercel**. Database và storage: **Supabase**.

---

## 3. Cấu trúc thư mục

```
app/
  layout.tsx, page.tsx          # Root layout + trang chủ (bảng công cụ)
  (public)/                     # about, cv, skills, contact, projects, projects/[slug], tools/mic-filter
  (auth)/                       # login, register, auth/callback, auth/auth-code-error
  (dashboard)/dashboard/        # layout (requireAuth), page, projects, projects/new, projects/[id]/edit, settings
  api/
    auth/me/                    # GET  user hiện tại
    profile/avatar/             # POST upload avatar (admin)
    projects/[id]/archive/      # POST upload ZIP
    projects/[id]/download/     # GET  tải ZIP
src/
  middleware.ts                 # Rate limit toàn cục, chặn /dashboard, security headers
  actions/                      # Server Actions: auth, projects, profile, contact
  components/
    features/                   # Hero, ProfileResume, ProfileSettingsForm, SkillsShowcase, ContactForm
    layout/                     # Navbar, NavbarClient, Footer, Sidebar
    projects/                   # ProjectCard, ProjectForm
    tools/                      # MicFilterWorkspace, MicFilterTool, ShiftSummaryPanel
    ui/                         # FullscreenLoader
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
                                #   export (text/bảng)
  lib/tools/mic-filter-settings.ts # Đọc cấu hình tool mic từ DB (server-only)
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

**Checklist:** mỗi số phòng trên 2 bảng là một nút bấm. Bấm vào thì phòng được đánh dấu đã soạn, đã thu, đã phát hoặc đã thay pin, bấm lại thì bỏ đánh dấu. Mỗi bảng có chip tiến độ như "Đã thu 1/3". Key của checklist có dạng `kind:floor:room`. Khi upload file mới hoặc bấm "Làm lại", checklist được xoá.

**Xuất bảng** (`export.ts`, `components/tools/table-image.ts`): mỗi bảng có 2 nút.

- **Copy chữ:** copy văn bản gọn để dán Zalo, bỏ các nhóm rỗng.
- **Copy ảnh:** vẽ bảng ra PNG bằng canvas, độ phân giải 2x, không dùng thư viện ngoài. Ảnh được copy vào clipboard. Nếu trình duyệt không cho copy ảnh thì ảnh được tải về dưới dạng file PNG.

**Kết ca** (`ShiftSummaryPanel`): form đếm các mục tăng/giảm máy lạnh, phản ánh phòng, đồ mượn, pin đã dùng và pin dư. Tool sinh ra đoạn văn bản báo cáo để copy. Nút **"Xoá dữ liệu kết ca"** (có hỏi xác nhận) đưa các bộ đếm về 0 và giữ nguyên ca đang chọn.

**Giữ phiên làm việc** (`session.ts`): localStorage key `mic-filter:session:v1` lưu báo cáo đã lọc, checklist và form kết ca, kèm `dayKey`.

- Trạng thái được khôi phục sau khi mount; có toast "Đã khôi phục phiên làm việc hôm nay".
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
- Sidebar dashboard chỉ hiện link "Tool lọc mic" và "Settings" với admin (`adminOnly` trong `ADMIN_NAV_LINKS`).

`constants.ts` giờ chỉ là **giá trị mặc định**. Khi đã lưu cấu hình trong dashboard, sửa `constants.ts` không còn tác dụng cho tới khi bấm "Về mặc định".

### 7.5. Liên hệ (`/contact`)

`ContactForm` gọi `submitContactMessage`, gồm các bước:

1. Zod validate: trim, chuẩn hoá email về chữ thường, giới hạn độ dài.
2. **Honeypot** `website`: nếu bị điền thì trả `success: true` giả và không ghi DB.
3. **Rate limit theo IP** (in-memory): 3 tin/10 phút, vượt thì khoá 30 phút.
4. **Rate limit theo email** (đếm trong DB, nên vẫn đúng trên serverless): tối đa 3 tin/giờ.
5. Ghi vào `contact_messages`, kèm `userId` nếu người gửi đã đăng nhập.

Form hiển thị lỗi từ server và thông báo khi gửi thành công. Hiện vẫn **chưa có thông báo** cho admin và **chưa có UI đọc tin**.

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

- DB production cần chạy theo đúng thứ tự ở §8.2.1 (resolve `0_init`, deploy migration mới) **trước khi** deploy code nhánh hiện tại.
- Mới có unit test cho logic thuần: mic-filter, quyền project, redirect. Chưa có integration test (server actions + DB) và e2e.
- Chưa có CI chạy `lint`, `test`, `build`.
- Đăng ký `/register` vẫn mở cho mọi người, dù viewer hiện không làm được gì thêm ngoài xem. Có thể cân nhắc tắt.

### 9.3. Model dữ liệu chưa có UI

- `ProjectPermission`: có logic share VIEW/EDIT nhưng form luôn gửi `sharedUsers: []`.
- `ContactMessage`: chưa có trang đọc và đánh dấu đã đọc.
- Chưa có trang quản lý user và role.
