# Thiết kế lại phần Skills (kết hợp GitHub + WakaTime)

## Mục tiêu

Tạo section Skills:

- Không còn hardcode
- Dữ liệu phản ánh thực tế (project + usage)
- Có độ tin cậy cao hơn portfolio thông thường

---

## Ý tưởng tổng thể

Kết hợp 3 nguồn dữ liệu:

1. GitHub → Skill theo dự án (bạn đã build gì)
2. WakaTime → Skill theo thời gian sử dụng (bạn dùng gì nhiều)
3. Manual → Soft skills và phần không thể tự động

---

## Cấu trúc section Skills mới

### 1. Core Tech Stack (GitHub-based)

Hiển thị công nghệ bạn thực sự đã dùng trong project

Dữ liệu lấy từ:

- repo languages
- package.json / dependencies
- repo topics

Hiển thị:

- React
- Next.js
- Node.js
- PostgreSQL
- Prisma

Bonus:

- Hiển thị số project dùng tech đó
  Ví dụ: React (5 projects)

---

### 2. Most Used Languages (WakaTime-based)

Hiển thị ngôn ngữ bạn dùng nhiều nhất theo thời gian thực

Dữ liệu:

- % thời gian coding
- số giờ

Hiển thị:

- TypeScript — 42%
- JavaScript — 30%
- Python — 10%

---

### 3. Tools & Environment (WakaTime + GitHub)

Hiển thị công cụ bạn dùng

Nguồn:

- WakaTime: VS Code, OS
- GitHub: Docker, Vercel

Hiển thị:

- VS Code
- Docker
- Vercel
- Git

---

### 4. Activity Insights (WakaTime)

Hiển thị thống kê coding

Ví dụ:

- 6h/ngày coding trung bình
- Active 5 ngày/tuần
- Top project tuần này

---

### 5. Soft Skills (Manual)

Giữ nguyên nhập tay

- Problem Solving
- Communication
- Teamwork
- Time Management

---

## Flow dữ liệu

### GitHub

1. Gọi API lấy repo
2. Lấy:
   - languages
   - topics
   - dependencies
3. Map → tech stack
4. Count số project

---

### WakaTime

1. Gọi API stats
2. Lấy:
   - languages
   - editors
   - activity
3. Map → usage stats

---

### Merge dữ liệu

- Nếu tech có trong cả GitHub và WakaTime:
  → ưu tiên hiển thị:
  - tên tech
  - số project (GitHub)
  - % usage (WakaTime)

Ví dụ:
React

- 5 projects
- 32% usage

---

## Logic gộp dữ liệu

### Case 1: Có cả GitHub + WakaTime

→ Hiển thị full info

### Case 2: Chỉ có GitHub

→ Hiển thị project-based

### Case 3: Chỉ có WakaTime

→ Hiển thị usage-based

---

## Gợi ý UI

### Card skill nâng cấp

Thay vì:

- chỉ list text

Bạn nên hiển thị:

Tên skill
Thanh progress (% usage)
Số project

Ví dụ:

React
[██████████░░] 32%
5 projects

---

## Tối ưu UX

- Có tab:
  - Overview
  - GitHub
  - WakaTime

- Hover skill:
  → hiện tooltip:
  - repo liên quan
  - thời gian sử dụng

---

## Lưu ý kỹ thuật

- GitHub API có rate limit → cần cache
- WakaTime cần API key → không expose ở frontend
- Nên fetch qua backend hoặc build-time

---

## Kết quả mong muốn

Sau khi hoàn thành:

- Skills không còn “fake”
- Hiển thị vừa:
  - kinh nghiệm thực tế (GitHub)
  - thói quen sử dụng (WakaTime)
- UI trông “pro” hơn portfolio bình thường
