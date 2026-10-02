# TECHNICAL — Tài liệu kỹ thuật `my-profile`

> Tài liệu mô tả hệ thống **theo đúng trạng thái code** sau đợt sửa nhóm 1 ngày `2026-10-02` (nền commit `b7a111e`).
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
    security/                   # rate-limit (in-memory), request (lấy IP)
    skills/                     # data.ts (tổng hợp skills), types.ts
    storage/                    # project-archives, profile-avatar (Supabase Storage)
    supabase/                   # client/server Supabase clients
    validators/                 # Zod schemas
    utils/constants.ts          # SITE_NAME, NAV_LINKS, ADMIN_NAV_LINKS
  tools/mic-filter/             # Logic thuần của tool mic: processor, alarm, constants, types
  types/index.ts                # Kiểu dùng chung
prisma/
  schema.prisma, seed.ts
scripts/grant-admin.sql         # Gán role admin thủ công
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
| `projects` | `status` có các giá trị DRAFT/PUBLISHED/ARCHIVED. `visibility` có các giá trị PUBLIC/PRIVATE/SHARED. `techStack` là chuỗi phân tách bằng dấu phẩy. `subjectName` và `semester` dành cho tài liệu môn học. |
| `project_files` | `filePath` là path trong bucket Supabase. Khi upload mới, các bản ghi cũ bị xoá và file cũ bị xoá khỏi storage. |
| `project_permissions` | Unique `(projectId, userId)`. Đã có schema và logic server nhưng **chưa có UI**. |
| `contact_messages` | Có `isRead` nhưng **chưa có UI đọc**. |

⚠️ Repo **chưa có thư mục `prisma/migrations`**. Môi trường hiện tại có thể đã được tạo bằng `db push` hoặc tạo tay. Xem [§9.2](#92-vận-hành--hạ-tầng).

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

**Luồng tạo hoặc cập nhật** (`ProjectForm`):

1. Người dùng nhập tiêu đề và chọn thư mục (`webkitdirectory`).
2. Client dựng payload với `slug = slugify(title)`, mô tả và nội dung sinh từ template, `visibility=PUBLIC`, `status=PUBLISHED`.
3. Gọi `createProject` hoặc `updateProject`. Slug được làm unique bằng cách thêm hậu tố `-2`, `-3`, ...
4. Client nén thư mục bằng JSZip (DEFLATE level 6), kiểm tra kích thước (mặc định ≤ 50MB, chỉnh qua `NEXT_PUBLIC_PROJECT_ARCHIVE_MAX_SIZE`).
5. Gửi `POST /api/projects/{id}/archive`. Server upload vào bucket **`portfolio-files`** (private) tại `project-archives/{projectId}/{timestamp}-{slug}.zip`. Trong một transaction, server thay bản ghi `project_files` cũ bằng bản mới rồi xoá file cũ khỏi storage. Nếu ghi DB lỗi thì file vừa upload bị xoá để rollback.

**Hiển thị public:** chỉ lấy các project có `PUBLIC` + `PUBLISHED` **và có ít nhất 1 file**.

**Download:** `GET /api/projects/{id}/download` kiểm tra visibility, tải blob từ storage qua service role, rồi trả về với `Content-Disposition` hỗ trợ tên UTF-8 và `Cache-Control: private, no-store`.

**Xoá:** xoá file trong storage trước (lỗi chỉ được log, không chặn), sau đó xoá bản ghi. Quan hệ cascade sẽ xoá `files` và `permissions` theo.

Giới hạn body: `serverActions.bodySizeLimit = 10mb`, `proxyClientMaxBodySize = 50mb` (`next.config.ts`).

### 7.3. Skills (`/skills`, `src/lib/skills/data.ts`)

`getSkillsPageData(profile)` gom 3 nguồn song song bằng `Promise.allSettled`, nên một nguồn lỗi không làm hỏng cả trang:

| Nguồn | Cấu hình | Cache | Dữ liệu |
|---|---|---|---|
| GitHub | `GITHUB_USERNAME` hoặc lấy từ `profile.githubUrl`; `GITHUB_TOKEN` tuỳ chọn; `SKILLS_GITHUB_REPO_LIMIT` | `revalidate` 6h | Repo, ngôn ngữ chính, topics, dependency trong `package.json` |
| Project archive | DB | Không cache | Đọc `techStack` của tối đa 24 project public |
| WakaTime | `WAKATIME_API_KEY` | `revalidate` 1h | Ngôn ngữ, editor, OS trong 7 và 30 ngày gần nhất |

Mỗi token được chuẩn hoá qua `TECH_DEFINITIONS` (alias → tên chuẩn + category). Sau đó hệ thống gộp thành `SkillTechCard`, gồm usage %, số project, nhãn nguồn và danh sách project làm bằng chứng. UI `SkillsShowcase` hỗ trợ lọc theo nhóm và sort theo usage, số project, độ mới và alphabet.

Mỗi nguồn có trạng thái `ready | needs-config | empty | error` để hiển thị trên UI.

> Lưu ý: vì `ProjectForm` luôn ghi `techStack = "ZIP archive, Downloadable resources"`, nguồn **Project archive hiện gần như không đóng góp skill nào**. Xem §9.1.

### 7.4. Tool lọc mic (`/tools/mic-filter`)

Toàn bộ xử lý chạy **ở client**. Không có bước lưu DB và không cần đăng nhập.

**Input:** file `.xls` hoặc `.xlsx`. Tool chỉ đọc **sheet đầu tiên**, dòng 1 là header. Tên cột được so khớp sau khi trim, gộp khoảng trắng và chuyển về chữ thường. **Dấu tiếng Việt vẫn phải đúng.** Riêng phần ghi chú thì được bỏ dấu trước khi tìm từ khoá.

| Cột | Bắt buộc |
|---|---|
| Mã phòng | ✅ |
| Thời gian bắt đầu | ✅ |
| Thời gian kết thúc | ✅ |
| Ghi chú | ✅ |
| Ngày học | Không (chỉ dùng để hiển thị nhãn ngày nếu cả file có đúng 1 ngày) |

**Xử lý** (`src/tools/mic-filter/processor.ts`):

1. Parse từng dòng và bỏ dòng trống. Dòng nào thiếu mã phòng, sai giờ, hoặc có giờ bắt đầu ≥ giờ kết thúc sẽ **gây lỗi cho cả file** (thông báo kèm số dòng).
2. Nếu ghi chú chứa "đã báo nghỉ" hoặc "không phát mic", dòng đó được đánh dấu `isIgnoredForMic`.
3. Mỗi dòng được xác định thuộc ca nào theo khung giờ (`SHIFT_WINDOWS`): sáng 07:30–11:35, chiều 12:30–16:35, tối 18:00–20:15. Một dòng có thể chồng lên nhiều ca.
4. Chỉ giữ các phòng có trong `WIRELESS_MIC_ROOMS` (danh sách hard-code các phòng E1-xx.yy có mic không dây). Kết quả được gộp theo phòng.
5. Tool sinh ra 2 bảng:
   - **Bảng phát mic buổi sáng:** các phòng dùng ca sáng, nhóm theo tầng.
   - **Bảng giữa trưa:** mỗi tầng chia thành 3 nhóm:
     - sáng có, chiều không → **thu**
     - sáng không, chiều có → **phát**
     - cả sáng và chiều → **thay pin**
6. **Nhắc bật máy lạnh** (`alarm.ts`) có 2 rule:
   - có lớp bắt đầu đúng 9h20 → nhắc lúc 9h
   - có lớp bắt đầu trong khoảng 15h–16h → nhắc lúc 15h

   Gợi ý chỉ hiện trong khung giờ cho phép. Tool dùng `setTimeout` và Browser Notification API, nên **tab phải luôn mở** thì mới nhận được thông báo.

**Kết ca** (`ShiftSummaryPanel`): form đếm các mục tăng/giảm máy lạnh, phản ánh phòng, đồ mượn, pin đã dùng và pin dư. Tool sinh ra đoạn văn bản báo cáo để copy vào clipboard. State chỉ nằm trong bộ nhớ, **reload trang là mất**.

Muốn đổi danh sách phòng, khung giờ hoặc rule nhắc thì sửa `src/tools/mic-filter/constants.ts` và `alarm.ts` rồi deploy lại.

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

Sau bước đó, `prisma migrate deploy` hoạt động bình thường cho các migration sau. Nếu muốn chắc DB khớp schema, chạy `prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma` trước khi resolve: kết quả rỗng nghĩa là khớp.

### 8.3. Scripts

| Script | Tác dụng |
|---|---|
| `dev` / `start` | Chạy dev server / production server |
| `build` | `prisma generate && next build` |
| `postinstall` | `prisma generate` (để Vercel có Prisma Client) |
| `lint` | ESLint |
| `test` | Unit test bằng `node:test` + `tsx` (file `src/**/__tests__/*.test.ts`) |
| `prisma:migrate` / `prisma:deploy` / `prisma:seed` | Migrate dev / deploy / seed role |

### 8.4. Deploy (Vercel)

- Khai báo đủ env ở §8.1 trên Vercel.
- Trong Supabase Auth, thêm domain production vào **Site URL** và **Redirect URLs**.
- Hai bucket storage sẽ tự tạo ở lần upload đầu tiên. Có thể tạo trước: `portfolio-files` (private) và `profile-images` (public).

---

## 9. Vấn đề đã biết & tech debt

### 9.1. Lỗi / lệch so với ý đồ

> Đã sửa ngày 2026-10-02: viewer tạo được tài liệu, open redirect ở callback, form liên hệ thiếu chống spam. Chi tiết ở PROJECT_HISTORY §8.

| # | Vấn đề | Vị trí | Mức |
|---|---|---|---|
| 3 | **Rate limit lưu trong bộ nhớ** (`Map` trên `globalThis`). Trên Vercel serverless, mỗi instance có bộ đếm riêng nên giới hạn gần như không có tác dụng. | `src/lib/security/rate-limit.ts` | 🟠 Trung bình |
| 5 | `publishProject` không set `publishedAt`. | `src/actions/projects.ts` | 🟡 Thấp |
| 6 | `updateProject` ghi `slug` từ input mà không kiểm tra trùng. Hiện form luôn gửi lại slug cũ nên chưa gây lỗi. | `src/actions/projects.ts` | 🟡 Thấp |
| 7 | `techStack` của tài liệu luôn là template, nên skills từ nguồn Project archive gần như rỗng. Đồng thời `subjectName`/`semester` bị ghi đè bằng tiêu đề và "Tài nguyên chia sẻ". | `ProjectForm.buildProjectPayload` | 🟡 Thấp |
| 8 | Text mặc định trong `resume-view.ts`, dashboard layout và avatar route là tiếng Việt **không dấu**. | nhiều file | 🟡 Thấp |
| 9 | `middleware.ts` đã bị đổi tên thành `proxy.ts` từ Next 16 (tên cũ vẫn chạy nhưng là deprecated). | `src/middleware.ts` | 🟡 Thấp |

### 9.2. Vận hành / hạ tầng

- Migration `0_init` đã có trong repo nhưng **DB production cần chạy `migrate resolve --applied 0_init` một lần** (§8.2.1).
- Mới có unit test cho logic thuần: mic-filter, quyền project, redirect. Chưa có integration test (server actions + DB) và e2e.
- Chưa có CI chạy `lint`, `test`, `build`.
- Đăng ký `/register` vẫn mở cho mọi người, dù viewer hiện không làm được gì thêm ngoài xem. Có thể cân nhắc tắt.

### 9.3. Model dữ liệu chưa có UI

- `ProjectPermission`: có logic share VIEW/EDIT nhưng form luôn gửi `sharedUsers: []`.
- `ContactMessage`: chưa có trang đọc và đánh dấu đã đọc.
- Chưa có trang quản lý user và role.
