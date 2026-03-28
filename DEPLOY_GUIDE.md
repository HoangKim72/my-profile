# Deploy Guide

> Hướng dẫn deploy dự án này dựa trên trạng thái code hiện tại sau khi đã tinh gọn schema những phần chưa dùng thật.

## 1. Những gì đã được tinh gọn

Hiện repo đã được lược bớt các phần schema chưa có flow sử dụng thật:

- bỏ `ProjectImage`
- bỏ `Tag`
- bỏ `ProjectTag`
- bỏ seed liên quan đến tag
- bỏ các `include` thừa trong `src/actions/projects.ts`

Những phần vẫn đang dùng thật và không nên xóa nếu bạn còn muốn giữ tính năng hiện tại:

- `User`
- `Profile`
- `Role`
- `UserRole`
- `Project`
- `ProjectFile`
- `ProjectPermission`
- `ContactMessage`

## 2. Cái gì phải giữ kín

Không được commit public:

- `.env`
- `.env.local`
- bất kỳ file `.env.*` có giá trị thật
- `.vercel/`
- database dump / SQL backup
- ảnh chụp màn hình hoặc file note nội bộ nếu bạn không muốn lộ quy trình làm việc

Biến môi trường phải giữ kín:

- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Biến môi trường có thể public vì client cần dùng:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STORAGE_BUCKET`
- `NEXT_PUBLIC_MAX_FILE_SIZE`

Lưu ý:

- `SUPABASE_SERVICE_ROLE_KEY` tuyệt đối không được đưa vào code client
- các biến có tiền tố `NEXT_PUBLIC_` sẽ đi ra client bundle

## 3. File nào nên cân nhắc ẩn hoặc bỏ khỏi repo public

Nếu repo của bạn là public, nên cân nhắc không để public các file ghi chú nội bộ như:

- `redessign.md`
- `Them_Ket_Ca.md`
- `PROJECT_HISTORY.md`
- `IMPLEMENTATION_SUMMARY.md`

Những file này không làm app chạy tốt hơn khi deploy. Chúng chỉ hữu ích cho quá trình làm việc nội bộ.

## 4. Hai hướng deploy phù hợp

### Cách khuyên dùng

`Vercel + Supabase`

Lý do:

- app đang dùng auth server-side, middleware, cookies, API routes
- có Prisma + PostgreSQL
- có upload/download archive qua Supabase Storage
- có route động và dashboard

Đây không phải app nên deploy kiểu static-only.

### Cách không khuyên dùng

- GitHub Pages
- static export

Vì app hiện tại cần server runtime.

## 5. Nếu database hiện tại đã có các bảng cũ

Nếu bạn đã từng dùng database cũ có các bảng:

- `project_images`
- `project_tags`
- `tags`

thì nên backup trước khi xóa.

SQL dọn bảng cũ:

```sql
DROP TABLE IF EXISTS project_images CASCADE;
DROP TABLE IF EXISTS project_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
```

Nếu bạn chưa có dữ liệu production, cách sạch nhất là tạo database Supabase mới rồi apply schema hiện tại từ đầu.

## 6. Việc phải làm trước khi deploy

### Bước 1. Chốt schema hiện tại

Repo hiện chưa có `prisma/migrations`, nên bạn nên tạo migration đầu tiên trước khi production:

```bash
npx prisma migrate dev --name init
```

Sau đó commit toàn bộ thư mục `prisma/migrations`.

Nếu local đang mở `next dev` hoặc tiến trình Node giữ Prisma engine và `prisma generate` bị lỗi `EPERM`, hãy tắt dev server rồi chạy lại:

```bash
npm run prisma:generate
```

### Bước 2. Build local

```bash
npm run lint
npm run build
```

### Bước 3. Push code lên GitHub

```bash
git add .
git commit -m "Prepare project for deploy"
git push origin main
```

## 7. Tạo production trên Supabase

1. Tạo project mới trên Supabase.
2. Lấy các giá trị:
   - Project URL
   - anon key
   - service role key
   - connection string pooled
   - connection string direct
3. Tạo storage bucket đúng tên bạn muốn dùng.
4. Cấu hình Auth Redirect URLs.

Redirect URLs nên có:

- `http://localhost:3000/**`
- `https://your-project.vercel.app/**`
- `https://*-your-team.vercel.app/**` nếu bạn dùng preview deploy

## 8. Biến môi trường cần set trên Vercel

Tối thiểu:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_STORAGE_BUCKET=portfolio-files
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

Nếu có dùng analytics:

```env
NEXT_PUBLIC_ANALYTICS_ID=...
```

## 9. Các bước deploy thực tế

### Cách đơn giản nhất

1. Push repo lên GitHub.
2. Vào Vercel.
3. Import repository.
4. Chọn framework là Next.js.
5. Thêm toàn bộ environment variables.
6. Deploy.

### Sau deploy đầu tiên

Chạy migrate production:

```bash
npx prisma migrate deploy
```

Chạy seed để tạo role:

```bash
npm run prisma:seed
```

Nếu muốn chạy migrate ngoài Vercel cho chắc, bạn có thể chạy từ máy local hoặc GitHub Actions.

## 10. Checklist sau khi deploy

Kiểm tra tối thiểu:

- trang chủ mở được
- `/projects` xem được danh sách folder public
- `/projects/[slug]` vào được chi tiết
- đăng ký / đăng nhập hoạt động
- dashboard vào được
- tạo project mới hoạt động
- upload folder ZIP hoạt động
- download file hoạt động
- `Tool lọc mic` mở được
- `Kết ca` copy nội dung bình thường

## 11. Gợi ý tinh gọn tiếp nếu muốn nhẹ hơn nữa

Những phần có thể tiếp tục bỏ, nhưng lúc này sẽ thay đổi behavior nên cần quyết định rõ:

- bỏ `ProjectPermission` nếu bạn không cần chia sẻ riêng theo user
- bỏ `ContactMessage` nếu bạn không cần form liên hệ lưu DB
- bỏ toàn bộ dashboard nếu bạn chỉ muốn site public tĩnh hơn

Những phần này mình chưa xóa vì đó không còn là “cleanup an toàn”, mà là đổi sản phẩm.
