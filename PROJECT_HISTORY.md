# Lịch Sử Và Trạng Thái Dự Án

> Tài liệu này ghi lại mục tiêu của project, các mốc phát triển chính, phần đã hoàn thành, phần còn thiếu, và tình trạng hiện tại của workspace.
>
> Cập nhật gần nhất: `2026-03-30`

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

- Giữ lại các cập nhật UI/logic gần đây:
  - brand hiện tại là `Anh coder`
  - headline trang chủ là `Bảng công cụ dành cho người dùng`
  - `Tool lọc mic` có `MicFilterWorkspace`, chế độ `Kết ca`, preview/copy nội dung và tooltip mô tả
  - logic mic-filter không còn phụ thuộc cột `Tên Phòng`
  - các dòng có `Ghi chú` chứa `Đã báo nghỉ` không vào Bảng 1 phát mic
- Bổ sung các thay đổi gần đây liên quan production/deploy:
  - đã deploy thành công lên `Vercel`
  - build đã được chỉnh để chạy `prisma generate` trước `next build`
  - thêm `postinstall` để tránh lỗi Prisma Client cũ trên Vercel
  - navbar public đã được chuyển sang lấy session phía client để không kéo `cookies()` vào mọi trang public lúc build
  - `/projects` và `/projects/[slug]` đã được cấu hình render động để tránh lỗi collect page data khi build
- Bổ sung các thay đổi UI/profile mới:
  - `/about` và `/cv` không còn hard-code, đã chuyển sang render từ profile của tài khoản `admin`
  - trang `Settings` trong dashboard đã được mở rộng để chỉnh hồ sơ public theo layout kiểu CV
  - đã có upload ảnh đại diện cá nhân và hiển thị ảnh đó ở `About` / `CV`
  - `Settings` và server action cập nhật profile hiện đã khóa theo role `admin`
  - navbar public đã được thiết kế lại rõ khối hơn, có border/blur/active state tốt hơn
  - đăng nhập/đăng ký hiện có loading overlay ở giữa màn hình khi đang xác thực/chuyển vào dashboard
  - sidebar dashboard đã sửa lỗi active state để không còn làm mục `Dashboard` sáng xanh sai khi đang ở `Settings` hoặc `Projects`
- Bổ sung các thay đổi mới trong ngày `2026-03-30`:
  - `Tool lọc mic` đã được dọn lại UI khu upload: bỏ 2 badge mô tả dư thừa, ẩn đoạn mô tả dài dưới tiêu đề và chuyển hướng dẫn sang note/tooltip nổi khi hover hoặc chạm vào icon upload
  - logic `Tool lọc mic` hiện đã bỏ hoàn toàn bước kiểm tra `Ngày học`; nếu file có cột này thì chỉ đọc như dữ liệu tham khảo, không còn chặn xử lý
  - trang `/skills` đã được làm lại theo hướng dữ liệu động: lấy profile admin, tổng hợp dữ liệu từ GitHub và WakaTime, chia tab hiển thị và có fallback an toàn khi thiếu config/API
  - production runtime đã được harden thêm: `/skills` có fallback khi không đọc được site profile, và helper `getSiteProfile()` hiện không còn làm `/about` / `/cv` chết trắng chỉ vì lỗi DB/Prisma
- Giữ lại nhận định rằng repo vẫn chưa có `prisma/migrations`
- Điều chỉnh lại phần production cho đúng hơn: app đã lên được internet, nhưng quyền truy cập public cho người ngoài vẫn còn phụ thuộc cấu hình `Deployment Protection` / domain trên Vercel
- Làm rõ hơn phần upload/storage: flow archive ZIP đã dùng được, nhưng phần policy/cleanup/vận hành production vẫn còn cần hoàn thiện

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

5. `2026-03-28` - Local + deploy snapshot
   - Đã deploy thành công project lên `Vercel`
   - Đã thêm tài liệu deploy riêng là `DEPLOY_GUIDE.md`
   - Đã sửa build script để `Prisma Client` luôn được generate trên Vercel
   - Đã sửa navbar để các trang public không còn bị ép dynamic chỉ vì đọc `cookies()`
   - Đã cấu hình `/projects` và `/projects/[slug]` theo hướng dynamic để tránh lỗi build khi đọc DB
   - Đã xác định việc người ngoài bị chặn truy cập site nhiều khả năng đến từ `Vercel Deployment Protection`, không phải từ middleware app

6. `2026-03-29` - Local workspace snapshot
   - `About` và `CV` đã được làm lại theo layout kiểu CV thay vì nội dung hard-code cũ
   - Dữ liệu public của `About` / `CV` hiện lấy từ profile của tài khoản `admin`
   - `dashboard/settings` đã có form chỉnh hồ sơ public theo cấu trúc CV: headline, tóm tắt, định hướng, điểm mạnh, dấu ấn, contact links
   - Đã có upload ảnh đại diện qua route riêng `/api/profile/avatar` và lưu `avatarUrl` vào `profiles`
   - `About` / `CV` hiện hiển thị ảnh đại diện nếu có, fallback sang initials nếu chưa upload
   - Quyền chỉnh profile public đã được siết lại: chỉ `admin` vào được `Settings` và gọi `updateProfile`
   - Navbar public đã được redesign với border/blur rõ hơn, active state tốt hơn và menu mobile gọn hơn
   - Login/Register hiện có loading overlay ở giữa màn hình để dễ theo dõi lúc xác thực
   - Đã bỏ nút `Create Account` khỏi header public
   - Sidebar dashboard đã sửa lỗi active state sai ở mục `Dashboard`

7. `2026-03-30` - Local workspace snapshot theo phase
   - `Phase 1 - Mic Filter UX cleanup`
   - Card `Tải lịch học` đã bỏ đoạn mô tả dài hiển thị mặc định để giao diện gọn hơn
   - Hướng dẫn upload hiện chuyển sang note/tooltip nổi khi hover, focus hoặc chạm vào icon upload
   - Đã bỏ 2 badge mô tả phụ dưới khu upload để phần đầu card nhẹ hơn
   - `Phase 2 - Mic Filter logic simplification`
   - Đã thử mở lại rule kiểm tra `Ngày học` theo hướng chỉ kiểm khi file có cột tương ứng, nhưng trạng thái cuối cùng của workspace hiện nay là bỏ hẳn bước kiểm tra đó
   - `Tool lọc mic` không còn khóa xử lý file theo ngày mai; cột `Ngày học` nếu có chỉ còn phục vụ đọc thông tin/tham khảo
   - `Phase 3 - Skills page expansion`
   - `/skills` đã chuyển từ nội dung tĩnh sang dữ liệu động lấy từ profile admin + GitHub + WakaTime
   - Đã có UI `SkillsShowcase` với tab `Overview / GitHub / WakaTime`, skill cards, evidence tooltip và các nhóm `Core Tech Stack`, `Most Used Languages`, `Tools & Environment`, `Activity Insights`, `Soft Skills`
   - Đã bổ sung env mẫu cho `GITHUB_USERNAME`, `GITHUB_TOKEN`, `SKILLS_GITHUB_REPO_LIMIT`, `WAKATIME_API_KEY`
   - `Phase 4 - Production hardening`
   - `/skills` hiện có fallback an toàn nếu không đọc được profile hoặc thiếu API/config ngoài production
   - `getSiteProfile()` đã được bọc an toàn hơn để `/about` và `/cv` không còn dễ nổ server error trắng trang chỉ vì lỗi đọc dữ liệu profile trên Vercel
   - Các lượt kiểm tra `eslint`, `tsc --noEmit` và `next build` cho phần thay đổi chính đều đã pass trong local workspace

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
- Build production đã được chỉnh để chạy `prisma generate` trước `next build`
- Có `postinstall` để tránh lỗi Prisma Client cũ khi deploy Vercel

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

Ngoài ra, public shell hiện đã được chỉnh lại để:

- navbar không còn làm mọi trang public dính `cookies()` khi build
- navbar public đã được redesign với border/blur, active state rõ hơn và mobile menu gọn hơn
- `/about` và `/cv` hiện render động theo dữ liệu profile + trạng thái user hiện tại
- `/about` và `/cv` không còn là nội dung tĩnh hard-code, mà lấy dữ liệu từ profile của tài khoản `admin`
- `About` / `CV` đã có khu hiển thị ảnh đại diện cá nhân
- `/about`, `/cv`, và `/skills` hiện đã được harden thêm để giảm nguy cơ nổ trắng trang khi dữ liệu profile/config production gặp lỗi
- `/projects` và `/projects/[slug]` được để dynamic theo đúng tính chất cần đọc DB lúc request
- `/skills` không còn là nội dung tĩnh hard-code, mà là trang tổng hợp kỹ năng động từ profile admin + GitHub + WakaTime với cơ chế fallback khi thiếu key hoặc API lỗi
- các trang như `/`, `/skills`, `/contact` vẫn giữ được cấu trúc public riêng, không bị kéo theo logic auth của navbar server-side

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
- Helper `requireAdmin` cho các màn hình/chức năng chỉ dành cho quản trị
- Loading overlay ở giữa màn hình khi login/register đang xác thực hoặc chuyển hướng vào dashboard
- Luồng chỉnh profile public hiện chỉ cho phép `admin`

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
- chỉnh hồ sơ public theo layout kiểu CV
- upload ảnh đại diện cá nhân cho profile public
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
- `src/lib/storage/profile-avatar.ts`
- API routes cho archive/download project
- API route upload avatar profile

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
- Khu upload lịch học đã được làm gọn hơn: hướng dẫn được chuyển sang note/tooltip gắn với icon upload thay vì luôn chiếm chỗ trong card

Logic xử lý đáng chú ý hiện tại:

- Không còn bắt buộc cột `Tên Phòng`
- Không còn kiểm tra/khóa xử lý theo `Ngày học`
- Nếu `Ghi chú` chứa `Đã báo nghỉ` thì dòng đó không được tính vào Bảng 1 phát mic
- Các xử lý liên quan báo thức/gợi ý cũng đã được điều chỉnh để tránh kéo sai từ dòng bị hủy

### 4.8. Deploy và production cơ bản

Hiện đã làm được:

- deploy project lên `Vercel`
- set các env production cần thiết cho `Supabase` / `Prisma`
- push schema production bằng `Prisma`
- seed role cơ bản
- build local pass với cấu hình gần production
- tạo tài liệu hướng dẫn deploy riêng trong `DEPLOY_GUIDE.md`

## 5. Những gì chưa làm được hoặc chưa hoàn thiện

### 5.1. Đã deploy nhưng chưa chốt public access/domain hoàn chỉnh

- App đã deploy thành công lên internet qua `Vercel`
- Tuy nhiên việc người ngoài truy cập còn bị chặn nếu `Deployment Protection` của Vercel chưa được tắt/chỉnh đúng
- Chưa xác nhận custom domain production đã được chốt hẳn
- `NEXT_PUBLIC_APP_URL`, redirect URL của Supabase, và domain public vẫn là phần cần kiểm tra kỹ sau deploy
- Với các route đọc profile/dữ liệu ngoài như `/about`, `/cv`, `/skills`, phần code đã được bọc fallback tốt hơn, nhưng env production trên Vercel vẫn phải khớp thì mới tránh lỗi runtime hoàn toàn

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
- quản lý chia sẻ project với UI đầy đủ

Nghĩa là một số capability có trong data model hoặc docs, nhưng chưa hoàn thiện ở mức màn hình quản trị.

### 5.4. Upload/storage đã dùng được ở mức cơ bản nhưng chưa hoàn tất production-ready

Repo đã có dấu hiệu chuẩn bị cho upload:

- bảng `project_files`
- validator upload/archive
- storage helper cho archive
- UI chọn folder và tự nén ZIP trong dashboard
- route upload archive
- route download archive
- route upload avatar profile
- storage helper cho ảnh đại diện profile

Nhưng vẫn còn thiếu hoặc chưa thật sự chốt hẳn:

- storage policy/permission production được kiểm tra đầy đủ
- cleanup/retention strategy rõ ràng
- giám sát lỗi upload/download ở môi trường production
- kiểm tra kỹ public access/policy cho bucket ảnh đại diện ngoài môi trường production
- luồng asset phong phú hơn ngoài archive ZIP nếu sau này cần mở rộng

### 5.5. Chưa có test rõ ràng

Hiện chưa thấy:

- unit test
- integration test
- e2e test

Điều này làm tăng rủi ro hồi quy khi tiếp tục sửa dashboard hoặc tool nội bộ.

### 5.6. Một số tài liệu khác vẫn đang lệch với code

Sau khi đối chiếu code hiện tại, có thể kết luận:

- `PROJECT_HISTORY.md` và `DEPLOY_GUIDE.md` hiện đã sát code hơn trước
- Nhưng `README.md`, `QUICKSTART.md`, và có thể cả một số file note nội bộ vẫn còn lệch nhẹ với trạng thái deploy/code mới nhất
- Ví dụ có chỗ mô tả như thể các phần quản trị và vận hành production đã rất trọn vẹn, trong khi thực tế vẫn còn việc phải chốt ở migration, domain public, deployment protection và UI quản trị sâu hơn

## 6. Tình trạng hiện tại của project

Tại thời điểm cập nhật file này, project đang ở trạng thái:

- Có nền tảng kỹ thuật tốt
- Có public site hoạt động được
- Có dashboard quản trị cơ bản
- Có auth + permission nền tảng
- Có một tool nội bộ dùng được là `Tool lọc mic`
- Đã deploy thành công lên `Vercel`
- `Tool lọc mic` là phần hoàn thiện nhất ở mặt tính năng nghiệp vụ gần đây
- `About` / `CV` đã chuyển sang dạng profile động, có ảnh đại diện và layout kiểu CV
- `/skills` đã tiến thêm một bước lớn từ trang tĩnh sang trang tổng hợp dữ liệu động
- Dashboard settings hiện đã gần với một profile editor thật hơn trước
- Giao diện vẫn đang được tinh chỉnh liên tục theo nhu cầu thực tế
- Public access cho người ngoài vẫn còn phụ thuộc cấu hình deploy/domain trên Vercel
- Workspace vẫn có tính chất local snapshot + production đang được hoàn thiện dần

Có thể xem project hiện đang ở giai đoạn:

`Đã có nền tảng tốt + đã dùng được cho nhiều luồng thật + đã deploy được + còn thiếu vài bước để production/public access thật sự trơn tru`

## 7. Việc nên làm tiếp theo

### Ưu tiên cao

1. Tắt/chỉnh đúng `Deployment Protection` và chốt domain public để người ngoài truy cập web bình thường
2. Tạo migration Prisma đầu tiên và commit vào repo
3. Đồng bộ lại `README.md`, `IMPLEMENTATION_SUMMARY.md`, `QUICKSTART.md` và các docs khác với trạng thái thật của code
4. Kiểm tra lại toàn bộ luồng production sau deploy: auth, upload ZIP, upload avatar, download, dashboard, mic-filter
5. Hoàn thiện UI quản lý users và contact messages nếu đó vẫn là mục tiêu

### Ưu tiên trung bình

1. Chuẩn hóa thêm dashboard cho project sharing
2. Thêm lớp test cho auth, projects, dashboard và mic-filter
3. Hoàn thiện hơn policy/cleanup/quan sát lỗi cho storage production
4. Rà lại bucket/policy cho ảnh đại diện profile trên Supabase Storage
5. Làm rõ hơn hướng mở rộng của khu “bảng công cụ”
6. Tách bớt logic/tool UI thành module nhỏ hơn nếu tiếp tục phát triển mạnh

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

- migration và lịch sử schema trong repo
- public access/domain/deployment protection
- upload/storage hoàn chỉnh ở mức production ops
- user management/contact management ở mức UI thật
- test và mức độ ổn định production
