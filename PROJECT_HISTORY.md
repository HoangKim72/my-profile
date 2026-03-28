# Lịch Sử Và Trạng Thái Dự Án

> Tài liệu này ghi lại mục tiêu của project, các mốc phát triển chính, phần đã hoàn thành, phần còn thiếu, và tình trạng hiện tại của workspace.
>
> Cập nhật gần nhất: `2026-03-28`

## 1. Dự án này dùng để làm gì?

Project này là một website portfolio xây bằng:

- `Next.js 16.2.1`
- `React 19.2.4`
- `TypeScript`
- `Tailwind CSS v4`
- `Prisma`
- `Supabase`

Mục tiêu hiện tại của project:

- Giới thiệu profile cá nhân dưới brand `Anh coder`
- Cung cấp các trang public để xem thông tin cá nhân, project, kỹ năng, CV và liên hệ
- Có khu vực dashboard để quản trị project và profile
- Có auth + phân quyền cơ bản theo role
- Kết nối dữ liệu qua `Prisma + PostgreSQL/Supabase`
- Mở rộng website thành nơi chứa các công cụ dùng trực tiếp trên web

Tại thời điểm hiện tại, project này không còn chỉ là một portfolio tĩnh. Nó đã có một phần public, một phần quản trị, và một công cụ nghiệp vụ đang dùng được là `Tool lọc mic`.

## 2. Điểm đã cập nhật trong lần rà soát này

So với bản cũ của `PROJECT_HISTORY.md`, lần cập nhật này đã chỉnh lại các điểm sau để khớp với code hiện tại:

- Cập nhật mốc thời gian từ `2026-03-27` lên `2026-03-28`
- Bổ sung brand hiện tại là `Anh coder`
- Bổ sung headline trang chủ đã đổi thành `Bảng công cụ dành cho người dùng`
- Bổ sung việc `Tool lọc mic` hiện đã có `MicFilterWorkspace` và chế độ `Kết ca`
- Bổ sung phần preview/copy nội dung kết ca và tooltip thông tin theo từng khối
- Bổ sung logic xử lý mới của mic-filter:
  - không còn phụ thuộc cột `Tên Phòng`
  - các dòng có `Ghi chú` chứa `Đã báo nghỉ` sẽ không được đưa vào Bảng 1 để phát mic
- Lược bớt schema các phần chưa có flow thật:
  - bỏ `ProjectImage`
  - bỏ `Tag`
  - bỏ `ProjectTag`
- Giữ lại nhận định rằng project vẫn chưa hoàn tất production/deploy và chưa có migration Prisma trong repo
- Giữ lại nhưng làm rõ hơn các phần README/tài liệu khác đang mô tả lạc quan hơn trạng thái thật của code

## 3. Lịch sử phát triển

### 3.1. Mốc theo git

1. `2026-03-22` - `62e8e90` - `Initial commit from Create Next App`
   - Khởi tạo project từ template Next.js
   - Đặt nền tảng ban đầu cho App Router, TypeScript, Tailwind

2. `2026-03-23` - `ca7155f` - `The first step`
   - Bắt đầu chuyển từ skeleton sang một portfolio có cấu trúc rõ ràng hơn

### 3.2. Mốc theo trạng thái workspace hiện tại

3. `2026-03-27` - Local workspace snapshot
   - Có thêm auth actions, profile actions, project actions
   - Có dashboard quản trị project/settings
   - Có route public `/tools/mic-filter`
   - Có đổi brand hiển thị sang `Anh coder`
   - Có điều chỉnh headline trang chủ thành `Bảng công cụ dành cho người dùng`

4. `2026-03-28` - Local workspace snapshot
   - `Tool lọc mic` được tách thêm `MicFilterWorkspace`
   - Có thêm chế độ `Kết ca` ngay trong cùng page
   - Có preview nội dung tổng kết ca và nút copy nhanh
   - Có tooltip icon `i` cho mô tả từng khối để UI gọn hơn
   - Logic mic-filter đã bỏ yêu cầu cột `Tên Phòng`
   - Logic mic-filter đã loại các phòng có `Ghi chú = Đã báo nghỉ` khỏi Bảng 1 phát mic
   - Đã bỏ các bảng schema chưa có flow thật: `project_images`, `tags`, `project_tags`

## 4. Những gì project đã làm được

### 4.1. Nền tảng kỹ thuật

- Dùng `App Router` với cấu trúc thật ở thư mục `app/`
- Có nhóm route:
  - `app/(public)`
  - `app/(auth)`
  - `app/(dashboard)`
  - `app/api`
- Dùng `TypeScript` xuyên suốt
- Dùng `Tailwind CSS v4`
- Dùng `Prisma` làm ORM
- Dùng `Supabase SSR` cho luồng auth phía server/client
- Có validator bằng `Zod`
- Có middleware bảo vệ route

### 4.2. Public site

Hiện đã có các route public:

- `/`
- `/about`
- `/projects`
- `/projects/[slug]`
- `/skills`
- `/cv`
- `/contact`
- `/tools/mic-filter`

Trang chủ hiện đóng vai trò như một bảng công cụ/public landing page dưới brand `Anh coder`.

### 4.3. Xác thực và phân quyền

Hiện đã có:

- Trang đăng nhập
- Trang đăng ký
- Route callback auth
- Route hiển thị lỗi auth code
- Utility kiểm tra session
- Middleware kiểm tra truy cập dashboard
- Hệ role cơ bản:
  - `guest`
  - `viewer`
  - `admin`
- Permission helper cho việc xem/chỉnh sửa/chia sẻ project

### 4.4. Dashboard quản trị

Hiện đã có các route dashboard:

- `/dashboard`
- `/dashboard/projects`
- `/dashboard/projects/new`
- `/dashboard/projects/[id]/edit`
- `/dashboard/settings`

Điều này cho thấy project đã có một admin area dùng được cho:

- quản lý project cơ bản
- chỉnh profile/settings
- phân tách luồng public và private

### 4.5. Business logic phía server

Hiện có server actions cho:

- `auth`
- `projects`
- `contact`
- `profile`

Ngoài ra còn có:

- `src/lib/auth`
- `src/lib/security`
- `src/lib/storage/project-archives.ts`
- API routes cho archive/download project

Nghĩa là project đã có logic ứng dụng thực tế chứ không chỉ là phần giao diện.

### 4.6. Database schema

Hiện có `prisma/schema.prisma` và `prisma/seed.ts`.

Schema đang bao phủ các nhóm dữ liệu chính:

- `users`
- `profiles`
- `roles`
- `user_roles`
- `projects`
- `project_files`
- `project_permissions`
- `contact_messages`

Đã có seed để tạo role mẫu.

### 4.7. Tool lọc mic

Đây là phần đã thay đổi nhiều nhất trong workspace gần đây.

Hiện tool này đã có:

- Upload file Excel `.xls/.xlsx`
- Xử lý dữ liệu lịch học bằng `xlsx`
- Bảng 1: soạn mic ca sáng
- Bảng 2: Thu / Phát / Thay Pin
- Gợi ý báo thức máy lạnh theo rule thời gian
- Toast trạng thái khi tải file, xử lý file, đặt báo thức, copy nội dung
- UI page shell riêng qua `MicFilterWorkspace`
- Chế độ `Kết ca` ngay trong cùng trang
- Chọn `Ca sáng / Ca chiều`
- Nhập/tăng/giảm số phản hồi máy lạnh
- Nhập/tăng/giảm số phản hồi phòng học với textarea chi tiết động
- Nhập/tăng/giảm số vật tư cho mượn với textarea chi tiết động
- Nhập/tăng/giảm số pin đã dùng và pin phát sinh thêm
- Preview nội dung kết ca
- Nút copy nội dung kết ca
- Tooltip `i` cho mô tả từng khối để giao diện gọn hơn

Logic xử lý đáng chú ý hiện tại:

- Không còn bắt buộc cột `Tên Phòng`
- Nếu `Ghi chú` chứa `Đã báo nghỉ` thì dòng đó không được tính vào Bảng 1 phát mic
- Các xử lý liên quan báo thức/gợi ý cũng đã được điều chỉnh để tránh kéo sai từ dòng bị hủy

## 5. Những gì chưa làm được hoặc chưa hoàn thiện

### 5.1. Chưa deploy production chính thức

- Chưa thấy cấu hình deploy chính thức trong repo
- Chưa có domain production
- Chưa có checklist production được chốt hẳn trong project

### 5.2. Prisma migration vẫn chưa có trong repo

- Hiện thư mục `prisma/` chỉ có:
  - `schema.prisma`
  - `seed.ts`
- Chưa có `prisma/migrations`

Điều này có nghĩa là schema đã có, nhưng lịch sử migration chưa được commit vào repo.

### 5.3. Một số phần dashboard vẫn chưa có UI đầy đủ

Hiện chưa thấy route/page riêng cho:

- quản lý users
- quản lý contact messages
- quản lý tag hoàn chỉnh
- quản lý chia sẻ project với UI đầy đủ

Nghĩa là một số capability có trong data model hoặc docs, nhưng chưa hoàn thiện ở mức màn hình quản trị.

### 5.4. Upload/storage chưa hoàn tất end-to-end

Repo đã có dấu hiệu chuẩn bị cho upload:

- bảng `project_files`
- validator upload
- storage helper cho archive

Nhưng chưa thấy full flow production-ready cho:

- upload file/image trực tiếp từ dashboard
- quản lý asset upload hoàn chỉnh
- cleanup/storage policy đầy đủ

### 5.5. Chưa có test rõ ràng

Hiện chưa thấy:

- unit test
- integration test
- e2e test

Điều này làm tăng rủi ro hồi quy khi tiếp tục sửa dashboard hoặc tool nội bộ.

### 5.6. Một số tài liệu khác vẫn đang lệch với code

Sau khi đối chiếu code hiện tại, có thể kết luận:

- `PROJECT_HISTORY.md` đã được cập nhật sát code hơn trong lần rà này
- Nhưng `README.md` và một số tài liệu khác vẫn còn mô tả hơi lạc quan
- Ví dụ README đang nói theo hướng gần production-ready và có `User Management`, `Contact Messages`, `File Uploads` như thể đã hoàn chỉnh, trong khi code hiện tại chưa thể hiện đầy đủ điều đó ở mức UI/flow thật

## 6. Tình trạng hiện tại của project

Tại thời điểm cập nhật file này, project đang ở trạng thái:

- Có nền tảng kỹ thuật tốt
- Có public site hoạt động được
- Có dashboard quản trị cơ bản
- Có auth + permission nền tảng
- Có một tool nội bộ dùng được là `Tool lọc mic`
- `Tool lọc mic` là phần hoàn thiện nhất ở mặt tính năng nghiệp vụ gần đây
- Giao diện vẫn đang được tinh chỉnh liên tục theo nhu cầu thực tế
- Workspace vẫn có tính chất local snapshot, chưa phản ánh trạng thái release chính thức

Có thể xem project hiện đang ở giai đoạn:

`Đã có nền tảng tốt + đã dùng được cho nhiều luồng thật + chưa hoàn tất production/deploy + tài liệu còn cần đồng bộ thêm`

## 7. Việc nên làm tiếp theo

### Ưu tiên cao

1. Tạo migration Prisma đầu tiên và commit vào repo
2. Đồng bộ lại `README.md`, `IMPLEMENTATION_SUMMARY.md`, và các docs khác với trạng thái thật của code
3. Chuẩn bị env + quy trình deploy production
4. Hoàn thiện upload/storage end-to-end
5. Hoàn thiện UI quản lý users và contact messages nếu đó vẫn là mục tiêu

### Ưu tiên trung bình

1. Chuẩn hóa thêm dashboard cho project sharing
2. Thêm lớp test cho auth, projects, dashboard và mic-filter
3. Làm rõ hơn hướng mở rộng của khu “bảng công cụ”
4. Tách bớt logic/tool UI thành module nhỏ hơn nếu tiếp tục phát triển mạnh

### Ưu tiên mở rộng

1. Bổ sung thêm tool nội bộ mới ngoài mic-filter
2. Search/filter nâng cao cho project
3. Analytics
4. Theme/system preference nếu cần

## 8. Kết luận

Project này hiện không còn là một portfolio cơ bản nữa.

Ở trạng thái hiện tại, nó là:

- một portfolio cá nhân có auth
- một dashboard quản trị project ở mức nền tảng
- một website đang mở rộng thành nơi chứa các công cụ nội bộ có thể dùng trực tiếp

Phần mạnh nhất hiện tại:

- kiến trúc nền tảng
- auth + permission
- dashboard CRUD project cơ bản
- `Tool lọc mic`, đặc biệt là phần UI/logic mới quanh `Kết ca`

Phần còn yếu hoặc chưa xong:

- migration và quy trình production
- upload/storage hoàn chỉnh
- user management/contact management ở mức UI thật
- test và mức độ ổn định production
