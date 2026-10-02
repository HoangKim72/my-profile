# PROJECT_HISTORY

> Nhật ký phát triển và roadmap. Tài liệu kỹ thuật chi tiết nằm ở [TECHNICAL.md](TECHNICAL.md).
>
> Cập nhật gần nhất: `2026-10-03`

## 1. Dự án này là gì?

`my-profile` hiện không còn là một portfolio tĩnh.

Đây là một ứng dụng web xây bằng:

- `Next.js 16.2.1`
- `React 19.2.4`
- `TypeScript`
- `Tailwind CSS v4`
- `Prisma`
- `Supabase`

Mục tiêu của dự án:

- giới thiệu profile cá nhân dưới brand `Anh coder`
- cung cấp khu public để xem profile, CV, skills, project archive và liên hệ
- có dashboard để quản trị profile và project
- có auth + phân quyền cơ bản
- lưu dữ liệu bằng `Prisma + PostgreSQL/Supabase`
- mở rộng website thành nơi chứa các công cụ nội bộ dùng trực tiếp trên web

## 2. Tài liệu đã được gom lại như thế nào?

Từ ngày `2026-04-02`, toàn bộ ghi chú rời rạc trước đây đã được gom về file này.

Những chủ đề từng nằm rải rác ở các file `.md` khác nay được tóm tắt tại đây:

- tổng quan dự án
- kiến trúc
- tình trạng triển khai
- phần đã làm
- phần đang làm
- phần sẽ làm
- ghi chú production, security, storage, roadmap

Nếu cần hiểu dự án nhanh, chỉ cần đọc file này.

## 3. Trạng thái hiện tại

### 3.1. Dự án đang làm được gì

Hiện tại dự án đã có các phần hoạt động thật:

- public website
- auth cơ bản
- dashboard quản trị
- profile editor
- project archive công khai
- skills page có evidence
- công cụ `mic-filter`

### 3.2. Cảm giác trưởng thành của codebase

Repo hiện ở trạng thái:

- đã qua giai đoạn demo đơn giản
- đã có business logic thật
- đã có data model tương đối rõ
- đã deploy được
- vẫn còn một số phần chưa đủ production-ready

Tóm gọn:

`đã dùng được cho nhiều luồng thật + còn cần thêm vài bước để vận hành mượt và dễ mở rộng`

## 4. Hiện dự án đang làm gì?

Đây là những hướng đang được thể hiện rõ nhất trong code tại thời điểm `2026-04-02`:

### 4.1. Biến public site thành một hồ sơ có bằng chứng

Phần public không chỉ hiển thị thông tin tĩnh nữa, mà đang đi theo hướng:

- profile động từ dữ liệu admin
- skills động từ nhiều nguồn
- project trở thành lớp evidence
- project archive vẫn tồn tại như route riêng để đọc sâu hơn

### 4.2. Đẩy trang Skills thành trung tâm khám phá năng lực

Trang `/skills` hiện là một trong những phần được đầu tư nhất gần đây.

Trạng thái mới:

- bỏ `Projects` khỏi navbar chính để menu gọn hơn
- vẫn giữ route `/projects`
- dùng skill card làm lớp chính
- dùng project làm lớp evidence nằm dưới skill
- skills được tổng hợp từ:
  - GitHub
  - project archive nội bộ
  - WakaTime
  - manual layer
- mỗi skill card hiện đã có:
  - tên skill nổi bật
  - usage signal
  - số project liên quan
  - source labels
  - evidence panel hover desktop
  - expand mobile
  - filter theo nhóm skill
  - sort theo usage, số project, độ mới, alphabet

### 4.3. Giữ project archive như một lớp nội dung riêng

Route `/projects` và `/projects/[slug]` vẫn tồn tại để:

- đọc chi tiết hơn
- tải archive ZIP
- giữ vai trò case study nhẹ
- làm đích điều hướng từ skills evidence

Nói cách khác:

- `Skills` là lớp khám phá nhanh
- `Projects` là lớp xem sâu hơn

### 4.4. Hoàn thiện dần dashboard admin

Dashboard hiện tập trung vào:

- project management
- chỉnh profile public
- upload avatar
- xuất bản nội dung public

Đây chưa phải admin panel đầy đủ, nhưng đã vượt qua mức CRUD demo.

### 4.5. Mở rộng hướng “website có tool dùng thật”

`/tools/mic-filter` cho thấy dự án không còn chỉ là portfolio.

Hướng mở rộng hiện tại là:

- public site
- admin area
- utility/tool area

## 5. Những gì dự án đã làm xong

### 5.1. Nền tảng kỹ thuật

Đã có:

- `App Router`
- route groups: `(public)`, `(auth)`, `(dashboard)`
- `TypeScript`
- `Tailwind CSS v4`
- `Prisma`
- `Supabase SSR`
- `Zod`
- middleware bảo vệ route
- build script có `prisma generate` trước `next build`
- `postinstall` để tránh lỗi Prisma Client trên deploy

### 5.2. Public routes

Hiện có các route public:

- `/`
- `/about`
- `/projects`
- `/projects/[slug]`
- `/skills`
- `/cv`
- `/contact`
- `/tools/mic-filter`

### 5.3. Authentication và authorization

Đã có:

- login
- register
- auth callback
- auth error page
- session check
- middleware bảo vệ dashboard
- role cơ bản:
  - `guest`
  - `viewer`
  - `admin`
- permission helper cho project
- chặn các luồng nhạy cảm theo role

### 5.4. Dashboard

Hiện có:

- `/dashboard`
- `/dashboard/projects`
- `/dashboard/projects/new`
- `/dashboard/projects/[id]/edit`
- `/dashboard/settings`

Dashboard đang xử lý được:

- tạo/sửa/xóa/xuất bản project
- chỉnh profile công khai
- upload avatar
- quản trị các nội dung public chính

### 5.5. Profile động

`/about` và `/cv` không còn hard-code.

Chúng đang lấy dữ liệu từ profile của tài khoản `admin`, gồm:

- tên
- headline
- bio
- contact links
- avatar
- nội dung dạng CV/resume

### 5.6. Skills page động

Đây là phần vừa được nâng cấp mạnh.

Đã làm xong:

- load profile an toàn
- tổng hợp signal từ GitHub
- tổng hợp signal từ WakaTime
- map thêm project archive nội bộ vào evidence
- gộp nhiều nguồn lại thành card skill
- thêm filter / sort
- thêm hover/click evidence panel
- thêm CTA vào project archive
- bỏ `Projects` khỏi navbar chính

### 5.7. Project archive

Project archive hiện hỗ trợ:

- danh sách project public
- trang chi tiết theo slug
- metadata cơ bản
- download archive ZIP
- hiển thị tech stack
- liên kết GitHub/demo nếu có

### 5.8. Tool `mic-filter`

Đây là phần business tool rõ nhất trong repo.

Đã làm được:

- upload file Excel `.xls/.xlsx`
- đọc dữ liệu bằng `xlsx`
- sinh bảng phát mic
- sinh bảng thu/phát/thay pin
- gợi ý báo thức máy lạnh
- có khu `Kết ca`
- có preview và copy nhanh
- có tooltip/note để UI gọn hơn
- đã bỏ các ràng buộc gây nhiễu như:
  - không còn bắt buộc cột `Tên Phòng`
  - không còn khóa theo `Ngày học`
  - các dòng `Đã báo nghỉ` không đi vào bảng phát mic

### 5.9. Server actions và API routes

Đã có server actions cho:

- `auth`
- `projects`
- `profile`
- `contact`

Đã có route handlers cho:

- auth me
- auth callback
- upload avatar
- archive project
- download project

### 5.10. Database và storage layer

Schema hiện bao phủ:

- `users`
- `profiles`
- `roles`
- `user_roles`
- `projects`
- `project_files`
- `project_permissions`
- `contact_messages`

Đã có:

- `prisma/schema.prisma`
- `prisma/seed.ts`
- helper cho project archive storage
- helper cho profile avatar storage

### 5.11. Production cơ bản

Đã làm được:

- build local pass
- deploy lên `Vercel`
- cấu hình script build ổn định hơn
- tránh kéo `cookies()` vào mọi trang public khi build
- để các route cần DB render động đúng cách
- harden thêm các trang public dùng profile/data ngoài

## 6. Những gì dự án đang làm dở hoặc đang cần chú ý

### 6.1. Production hardening vẫn chưa chốt hẳn

Phần production đã tiến bộ, nhưng vẫn cần theo dõi:

- domain public
- redirect URL auth
- bucket policy
- deployment protection
- upload/download ngoài môi trường local

### 6.2. Migration Prisma đã có baseline, DB production cần resolve

Từ `2026-10-02`, repo đã có `prisma/migrations/0_init`. DB production đã có bảng từ trước, nên cần chạy `prisma migrate resolve --applied 0_init` **một lần** (xem TECHNICAL §8.2.1).

### 6.3. Test coverage mới ở mức unit

Từ `2026-10-02` đã có `npm test` (`node:test` + `tsx`), gồm 31 test cho mic-filter, quyền project và redirect an toàn.

Vẫn còn thiếu:

- integration tests
- e2e tests
- CI

### 6.4. Admin panel chưa phủ hết các capability

Hiện data model và ý tưởng hệ thống đã rộng hơn UI hiện tại.

Ví dụ chưa có khu quản trị hoàn chỉnh cho:

- users
- contact messages
- quyền chia sẻ project với UI đầy đủ
- vận hành storage ở mức sâu hơn

## 7. Những gì sẽ làm tiếp theo

### 7.1. Ưu tiên gần

1. Chốt production config thật sự ổn định.
2. ~~Tạo và commit migration Prisma.~~ Đã xong `2026-10-02`, còn bước resolve trên production.
3. Rà lại toàn bộ flow:
   - auth
   - dashboard
   - upload avatar
   - upload/download project archive
   - skills evidence
   - mic-filter
4. Hoàn thiện thêm admin area còn thiếu.
5. ~~Bắt đầu thêm test cho những luồng có rủi ro cao.~~ Đã có unit test `2026-10-02`, bước tiếp theo là CI và integration test.

### 7.2. Ưu tiên sản phẩm

1. Tiếp tục nâng chất lượng trang `Skills`.
2. Xem lại mức độ “case study” của project detail page.
3. Làm rõ hơn hướng mở rộng cho khu `tools`.
4. Cân nhắc thêm analytics hoặc dashboard metrics thực dụng hơn. ~~Tìm kiếm~~ đã có ở `/projects` từ `2026-10-03`.

### 7.3. Ưu tiên kỹ thuật

1. Chuẩn hóa docs theo đúng trạng thái code.
2. Siết lại production policies cho storage và auth.
3. Thêm test automation.
4. Giảm rủi ro ở các phần có nhiều điều kiện quyền truy cập.

## 8. Mốc phát triển đáng nhớ

### `2026-03-22`

- khởi tạo dự án từ nền Next.js

### `2026-03-23`

- bắt đầu định hình dự án thành portfolio có cấu trúc thật hơn

### `2026-03-27` đến `2026-03-29`

- xuất hiện auth, dashboard, profile settings, project actions
- bắt đầu có tool `mic-filter`
- public profile chuyển dần sang dữ liệu động

### `2026-03-30`

- `mic-filter` được dọn UX và đơn giản hóa logic
- `/skills` bắt đầu chuyển từ tĩnh sang động
- production được harden thêm ở các route public

### `2026-04-02`

- skills page được làm lại theo hướng evidence-driven rõ hơn
- `Projects` được bỏ khỏi navbar chính
- project archive được giữ làm đích điều hướng từ skill evidence
- docs được gom lại về một nơi duy nhất là file này

### `2026-10-02`

Đọc lại toàn bộ code, viết `docs/TECHNICAL.md`, rồi làm **nhóm 1: sửa lỗi bảo mật và nền móng**.

Quyết định sản phẩm đã chốt với chủ dự án:

- "Project" là **kho tài liệu môn học dạng ZIP**, không phải case study portfolio
- **chỉ admin được đăng tài liệu**
- tool lọc mic phục vụ **công việc cá nhân** của chủ site
- PROJECT_HISTORY là nhật ký, còn TECHNICAL.md là tài liệu kỹ thuật

Đã làm:

- **Chỉ admin được tạo tài liệu:**
  - thêm `canCreateProject` và chặn trong `createProject`
  - `/dashboard/projects/new` dùng `requireAdmin`
  - ẩn nút "Tạo folder" với viewer ở dashboard
- **Sửa open redirect ở `/auth/callback`:**
  - thêm `getSafeRedirectPath` (`src/lib/security/redirect.ts`)
  - redirect luôn dựa trên origin của request
- **Chống spam form liên hệ:**
  - honeypot `website`
  - rate limit theo IP (3 tin/10 phút)
  - rate limit theo email đếm trong DB (3 tin/giờ)
  - form hiện lỗi và thông báo thành công
  - action không còn trả object tin nhắn về client
- **Migration Prisma:** thêm `prisma/migrations/0_init` và `migration_lock.toml`
- **Test:** thêm script `npm test` với 31 test:
  - `processMicFilterFile`
  - rule nhắc máy lạnh
  - quyền project
  - `getSafeRedirectPath`
- Đã kiểm tra `tsc`, `eslint`, `next build`: đều pass

Việc còn treo:

- chạy `prisma migrate resolve --applied 0_init` trên DB production
- rà các tài liệu viewer đã tạo trước đợt sửa này
- quyết định có tắt `/register` hay không

Commit trên nhánh `feat/hardening-and-resources`: `e5a3cdc` (danh sách phòng mic do chủ dự án sửa), `25a9c31` (nhóm 1), `3ee0ea7` (docs).

### `2026-10-03`

Làm **nhóm 2: kho tài liệu môn học**, tiếp trên nhánh `feat/hardening-and-resources`.

Đã làm:

- **Form tài liệu đúng nghĩa:**
  - các trường: tên, môn học, kỳ học, mô tả ngắn, ghi chú, tag, trạng thái Công khai/Nháp
  - bỏ toàn bộ text tự sinh
  - tag lưu vào `techStack` dạng chuẩn hoá nên trang Skills cũng đọc được
- **Lọc `/projects`:**
  - tìm theo từ khoá
  - lọc theo môn học và kỳ học, có số lượng
  - sắp xếp mới nhất / tải nhiều / tên
  - dùng form GET, không cần JS phía client
- **Đếm lượt tải:**
  - thêm cột `projects.downloadCount`, không tính tác giả và admin
  - hiện trên thẻ, trang chi tiết và dashboard (kèm tổng lượt tải)
- **Xem trước nội dung ZIP:**
  - server đọc ZIP lúc upload và lưu `project_files.entries`; bước này cũng từ chối ZIP hỏng
  - trang chi tiết hiện cây thư mục
  - thêm script `npm run archives:backfill` cho archive cũ
- Migration `20261002000000_resource_downloads_and_manifest`.
- **Sửa thêm:**
  - set `publishedAt` khi publish
  - kiểm tra slug trùng khi update
  - tài liệu Nháp/Lưu trữ bị ẩn khỏi trang chi tiết và download với người ngoài
- Test tăng từ 31 lên 46 (manifest ZIP, tag, bộ lọc, validator).
- `tsc`, `eslint`, `next build` đều pass.

Chưa kiểm tra được:

- giao diện chạy thật với DB, vì DB chưa có 2 cột mới (xem TECHNICAL §8.2.1)

Việc còn treo:

- **chạy migration theo TECHNICAL §8.2.1 trước khi merge/deploy**
- sửa lại môn học, kỳ học, tag cho các tài liệu cũ (đang mang giá trị placeholder)
- chạy `archives:backfill` nếu muốn có preview cho archive cũ

#### Nhóm 3: tool lọc mic (cùng ngày `2026-10-03`)

Đã làm:

- **Giữ phiên làm việc qua reload:**
  - báo cáo đã lọc, checklist và form kết ca được lưu vào localStorage theo ngày
  - tự xoá khi sang ngày mới, kể cả khi tab mở qua đêm
- **Checklist trên bảng:**
  - bấm số phòng để đánh dấu đã soạn/thu/phát/thay pin
  - chip tiến độ cho từng loại
- **Cấu hình trong dashboard:**
  - danh sách phòng mic, giờ 3 ca và rule nhắc máy lạnh chuyển vào bảng `tool_settings`
  - trang admin `/dashboard/tools/mic-filter`
  - DB lỗi thì tool tự dùng cấu hình mặc định
  - migration `20261003000000_tool_settings`
- **Xuất bảng:** "Copy chữ" và "Copy ảnh" (PNG vẽ bằng canvas, không thêm thư viện); nếu không copy được ảnh thì tải file về.
- Nút **"Xoá dữ liệu kết ca"**.
- Sidebar ẩn các link chỉ dành cho admin với viewer.
- Test tăng từ 46 lên 63 (config, processor với cấu hình tuỳ chỉnh, session, export).
- `tsc`, `eslint`, `next build` đều pass.

Đã chạy thử trên trình duyệt (dev server, `/tools/mic-filter`):

- upload file → 2 bảng đúng
- bấm checklist → tiến độ cập nhật
- reload → khôi phục đúng kết quả và checklist
- ảnh PNG xuất ra hiển thị đúng tiếng Việt

Chưa kiểm tra được:

- copy vào clipboard: browser pane chặn clipboard, nút copy kết ca có sẵn từ trước cũng bị chặn
- trang cấu hình admin: cần đăng nhập và DB

**Phát hiện:** DB trong `.env.local` hiện **không kết nối được**. Supabase pooler báo `tenant/user postgres.<project-ref> not found`; có thể project đã bị pause/xoá hoặc env đã cũ.

Việc còn treo (bổ sung):

- kiểm tra lại project Supabase / `.env.local`
- migration `tool_settings` nằm chung bước deploy ở TECHNICAL §8.2.1
- giao diện tool mic: đã làm lại, xem mục "Làm lại giao diện tool lọc mic" bên dưới

#### Chạy migration lên Supabase (cùng ngày `2026-10-03`)

Lý do DB không kết nối được: project Supabase **bị pause**. Chủ dự án đã resume, sau đó mình chạy theo TECHNICAL §8.2.1 (đã được chủ dự án đồng ý):

1. `migrate diff` (chỉ đọc): DB khớp baseline `0_init`, chỉ thiếu 2 cột và bảng `tool_settings`.
2. `migrate resolve --applied 0_init`.
3. `migrate deploy`: áp dụng `20261002000000_resource_downloads_and_manifest` và `20261003000000_tool_settings`.
4. `migrate diff` lần nữa: không còn khác biệt.

Kết quả kiểm tra:

- `archives:backfill --dry-run`: đọc được cả 4 archive cũ (31 đến 5327 file). **Chưa ghi.**
- Rà dữ liệu: cả 4 tài liệu đều do admin tạo, hệ thống chỉ có 1 user. Việc "rà tài liệu do viewer tạo" coi như xong.
- Chạy app với DB thật:
  - `/projects`: lọc, tìm (`q=php` ra 1 kết quả), sắp xếp đều chạy đúng
  - trang chi tiết chạy đúng
  - `/tools/mic-filter` đọc cấu hình không lỗi
- Code trên `main` vẫn chạy được với schema mới, vì thay đổi chỉ là thêm cột có default và thêm bảng.

Việc còn treo:

- chạy `npm run archives:backfill` (ghi thật) để có preview ZIP
- sửa môn học, kỳ học, tag cho 4 tài liệu (đang là "Shared resources" và tag placeholder)
- merge nhánh `feat/hardening-and-resources` vào `main` để deploy
- quyết định có tắt `/register` hay không

#### Làm lại giao diện tool lọc mic (cùng ngày `2026-10-03`)

Chủ dự án duyệt layout qua nhiều vòng mockup và chốt các điểm sau:

- bỏ bộ màu ngọc/vàng (khó nhìn), dùng nền sáng, chữ gần đen, mỗi việc một màu
- dùng chủ yếu trên **máy tính**; **không cần tick từng phòng**
- 2 tab: **Lọc mic** (2 bảng) và **Kết ca** (xuất PDF)
- bảng soạn mic sáng không có nút copy; bảng trưa chỉ **Copy ảnh**
- báo thức máy lạnh là một dòng riêng đặt trên bảng trưa
- ô phòng chỉ ghi số phòng; dữ liệu `roomDisplay` vốn đã như vậy nên không phải sửa processor

Đã làm:

- viết lại `MicFilterTool` và `ShiftSummaryPanel`; `MicFilterWorkspace` chỉ còn là khung trang
- thêm biến màu `--mic-*` (sáng/tối) và CSS in cho Xuất PDF vào `globals.css`; font nạp bằng `next/font` trong `page.tsx`
- Kết ca: thêm/xoá từng dòng phản hồi và vật tư; Xuất PDF bằng `window.print()` thay cho copy văn bản
- bỏ checklist khỏi `session.ts`, bỏ `buildMorningText`, `buildMiddayText`, `buildMorningExportTable` khỏi `export.ts`, cập nhật test
- kéo-thả file vào ô tải lên

Kiểm tra:

- `tsc`, `eslint`, `npm test` (59 test), `next build`: đều pass
- chạy dev với phiên mẫu trong localStorage: 2 tab, cả 2 theme, dòng báo thức, Copy ảnh (browser pane chặn clipboard nên tool chuyển sang tải PNG, đúng như thiết kế)
- chưa thử hộp thoại in/PDF thật và upload file Excel thật trên giao diện mới

Merge nhánh `feat/hardening-and-resources` vào `main` để deploy.

## 9. Sơ đồ hiểu nhanh dự án

### Lớp public

- giới thiệu bản thân
- cho xem năng lực
- cho xem/tải project archive
- cho dùng tool

### Lớp admin

- chỉnh profile
- quản trị project
- xuất bản nội dung public

### Lớp dữ liệu

- Prisma
- PostgreSQL / Supabase
- storage cho archive và avatar

### Lớp kiểm soát

- auth
- middleware
- role/permission
- validators

## 10. Kết luận ngắn

Hiện tại `my-profile` là:

- một portfolio cá nhân có dữ liệu động
- một dashboard quản trị nền tảng
- một project archive có thể dùng như lớp evidence
- một nơi đang mở rộng dần thành workspace chứa tool nội bộ

Phần mạnh nhất lúc này:

- nền tảng kỹ thuật
- skills evidence flow
- profile động
- project archive
- `mic-filter`

Phần còn yếu hoặc chưa chốt:

- migration
- test
- production ops
- admin coverage sâu hơn

Nếu cần hình dung dự án trong một câu:

`Đây là một portfolio đã vượt qua mức giới thiệu cá nhân cơ bản, đang tiến dần thành một hệ thống hồ sơ + evidence + tools có thể dùng thật.`
