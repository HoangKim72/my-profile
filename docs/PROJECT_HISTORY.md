# PROJECT_HISTORY

> Single source of truth cho toàn bộ tài liệu dự án.
>
> Cập nhật gần nhất: `2026-04-02`

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

### 6.2. Migration Prisma chưa được commit đầy đủ

Hiện repo có schema và seed, nhưng chưa có lịch sử migration được commit rõ ràng.

Đây là một khoảng trống quan trọng nếu muốn vận hành dự án ổn định hơn theo team flow.

### 6.3. Test coverage gần như chưa có

Hiện chưa thấy:

- unit tests
- integration tests
- e2e tests

Điều này làm tăng rủi ro hồi quy khi tiếp tục mở rộng dashboard, auth và tools.

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
2. Tạo và commit migration Prisma.
3. Rà lại toàn bộ flow:
   - auth
   - dashboard
   - upload avatar
   - upload/download project archive
   - skills evidence
   - mic-filter
4. Hoàn thiện thêm admin area còn thiếu.
5. Bắt đầu thêm test cho những luồng có rủi ro cao.

### 7.2. Ưu tiên sản phẩm

1. Tiếp tục nâng chất lượng trang `Skills`.
2. Xem lại mức độ “case study” của project detail page.
3. Làm rõ hơn hướng mở rộng cho khu `tools`.
4. Cân nhắc thêm analytics, tìm kiếm, hoặc dashboard metrics thực dụng hơn.

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
