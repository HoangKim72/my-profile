# Checklist chỉnh sửa trang Skills và bỏ Projects khỏi navbar

## 1. Mục tiêu tổng thể

- Làm gọn navbar bằng cách bỏ mục **Projects** khỏi điều hướng chính.
- Giữ lại giá trị của phần **project** như một lớp **evidence** nằm trong trang **Skills**.
- Làm card skill dễ đọc hơn, dễ quét hơn, dễ phân biệt hơn.
- Cho người dùng thấy rõ: **skill nào đã dùng**, **dùng bao nhiêu**, **dùng trong project nào**.
- Bổ sung **hover / popover** để hiện danh sách project đã từng dùng skill đó.
- Bổ sung **filter / sort** để người xem tra cứu nhanh hơn.

---

## 2. Những việc cần làm khi muốn bỏ Projects khỏi navbar

### 2.1. Xác định lại vai trò của trang Skills

Cần chốt rõ trang Skills sau khi chỉnh sửa sẽ là:

- nơi thể hiện các kỹ năng đã dùng thực tế
- nơi cho thấy kỹ năng đó đến từ project nào
- nơi hiển thị mức độ sử dụng và nguồn evidence

### 2.2. Check trước khi bỏ Projects khỏi navbar

- Trang Skills đã đủ khả năng thay vai trò của trang Projects chưa?
- Người xem có còn cần một trang Projects riêng để đọc case study sâu hơn không?
- Mỗi skill đã có liên kết hoặc cách dẫn đến project liên quan chưa?
- Dữ liệu project đã được gắn đúng vào từng skill chưa?
- Khi bỏ Projects khỏi navbar, người dùng còn đường nào để đi vào từng project không?

### 2.3. Phương án an toàn nên làm

- Bỏ **Projects** khỏi navbar chính.
- Vẫn giữ **project page** riêng nếu cần.
- Dẫn đến project từ:
  - hover / popover trong card skill
  - badge project
  - phần related projects

### 2.4. Những thứ cần kiểm tra sau khi bỏ khỏi navbar

- Luồng điều hướng có còn rõ không?
- Người dùng có tìm thấy project từ trang Skills không?
- Có bị mất traffic hoặc mất khả năng đọc case study không?
- Navbar sau khi bỏ Projects có cân đối, đẹp và dễ hiểu hơn không?

---

## 3. Những việc cần làm để sửa card skill dễ nhìn hơn

### 3.1. Sắp lại thứ tự ưu tiên thông tin trong card

Trong mỗi card skill nên hiển thị theo thứ tự:

1. **Tên skill**
2. **Mức độ usage / độ nổi bật**
3. **Số project đã dùng**
4. **Tổng thời gian / usage signal**
5. **Nguồn signal**
6. **Gợi ý hover để xem project liên quan**

### 3.2. Làm rõ các trường quan trọng

Cần làm rõ 3 thứ chính trong card:

- **Tên skill**
- **Usage**
- **Số project**

### 3.3. Những điểm cần check khi sửa card

- Tên skill có nổi bật hơn các badge khác không?
- Usage có được đọc nhanh chỉ trong 1 ánh nhìn không?
- Số project có dễ thấy không?
- Các badge GitHub / WakaTime có đang chiếm quá nhiều sự chú ý không?
- Card có quá nhiều chi tiết ngang hàng khiến mắt người xem khó quét không?
- Mỗi card có đang cho cảm giác giống dashboard nội bộ hơn là portfolio không?

### 3.4. Gợi ý hướng trình bày card

Mỗi card có thể gồm:

- tên skill lớn, rõ
- một dòng mô tả ngắn
- dòng thống kê ngắn gọn: `3 projects • 6h 41m • GitHub + WakaTime`
- progress bar hoặc usage bar
- dòng gợi ý: `Hover để xem project đã dùng skill này`

---

## 4. Làm rõ tên skill, usage, số project

### 4.1. Tên skill

Cần làm:

- tăng độ nổi bật của tên skill
- giảm cạnh tranh thị giác từ các badge phụ
- giữ style nhất quán giữa các card

Check:

- card nào nhìn vào cũng thấy tên skill trước tiên
- không bị badge hoặc số liệu lấn át tên skill

### 4.2. Usage

Cần làm:

- thống nhất cách hiển thị usage
- chọn một kiểu chính: phần trăm, thời gian, hoặc level
- nếu dùng phần trăm thì cần giải thích rõ ý nghĩa
- nếu dùng thời gian thì nên đi kèm context

Check:

- usage có dễ hiểu với người xem không chuyên không?
- các skill có cùng cách đo usage không?
- số liệu usage có nhất quán giữa GitHub signal và WakaTime signal không?

### 4.3. Số project

Cần làm:

- đưa số project lên vị trí dễ thấy hơn
- dùng label rõ ràng như `1 project`, `3 projects`
- cho phép click hoặc hover để xem các project đó

Check:

- số project có phải là số project thực sự liên quan không?
- có skill nào hiện ít project nhưng thực tế dùng ở nhiều nơi không?
- có bị trùng project giữa các nguồn signal không?

---

## 5. Thêm hover / popover hiện danh sách project đã dùng skill đó

### 5.1. Mục tiêu của hover / popover

Khi rê chuột vào card skill, người dùng cần thấy ngay:

- skill này đã được dùng trong những project nào
- project nào là nổi bật
- mỗi project dùng skill đó để làm gì

### 5.2. Nội dung nên có trong popover

Mỗi project trong popover nên có:

- tên project
- loại project hoặc vai trò ngắn
- mô tả 1 dòng ngắn
- trạng thái hoặc badge nếu cần

Ví dụ:

- `my-profile` — portfolio site
- `dashboard-ui` — admin dashboard
- `fullstack-auth-app` — auth + database

### 5.3. Những gì cần check khi làm hover / popover

- hover state có đủ nổi bật không?
- popover có tách nền rõ khỏi card không?
- người dùng có đọc được danh sách project dễ dàng không?
- danh sách project có bị quá dài không?
- nếu nhiều project thì có cần scroll hoặc nút “xem thêm” không?
- popover có che mất nội dung quan trọng khác không?
- trên mobile có phương án thay hover bằng click / expand không?

### 5.4. Trạng thái tương tác nên có

- default state
- hover state của card
- popover mở
- hover từng item project trong popover
- click vào project để mở chi tiết

### 5.5. Cần làm rõ để người dùng dễ phân biệt

- skill là lớp chính
- project là lớp evidence nằm dưới skill
- mỗi project item nên có kiểu hiển thị khác card skill
- project nổi bật có thể có badge như:
  - Featured
  - Recent
  - Production

---

## 6. Thêm filter / sort cho Skills

### 6.1. Filter nên có

Có thể cân nhắc các filter như:

- All
- Core stack
- Frontend
- Backend
- Database
- Tools
- Manual / Soft skills

### 6.2. Sort nên có

Có thể cân nhắc các cách sort như:

- Most used
- Most projects
- Recently active
- Alphabetical

### 6.3. Những gì cần check khi thêm filter / sort

- Người dùng có hiểu logic filter ngay không?
- Một skill có thể thuộc nhiều nhóm không?
- Sort mặc định nên là gì?
- Khi filter xong card có còn cân layout không?
- Filter / sort có làm trải nghiệm nặng hoặc rối không?
- Trên mobile filter / sort hiển thị dạng nào cho gọn?

### 6.4. Gợi ý vị trí đặt filter / sort

Nên đặt ở đầu section Skills, phía trên grid card.

Ví dụ:

- bên trái: nhóm filter
- bên phải: dropdown sort

---

## 7. Checklist triển khai theo thứ tự ưu tiên

### Ưu tiên 1 — Điều hướng

- [ ] Xác định rõ trang Skills có đủ thay thế vai trò Projects chưa
- [ ] Bỏ Projects khỏi navbar
- [ ] Giữ đường dẫn vào project từ trang Skills
- [ ] Kiểm tra lại luồng điều hướng toàn site

### Ưu tiên 2 — Card skill

- [ ] Làm nổi bật tên skill
- [ ] Làm rõ usage
- [ ] Làm rõ số project
- [ ] Giảm bớt cảm giác rối từ badge phụ
- [ ] Chuẩn hóa cấu trúc thông tin giữa các card

### Ưu tiên 3 — Hover / popover project evidence

- [ ] Thiết kế hover state rõ ràng
- [ ] Hiện danh sách project đã dùng skill đó
- [ ] Thêm mô tả ngắn cho từng project
- [ ] Kiểm tra trường hợp có nhiều project
- [ ] Chuẩn bị phương án mobile thay cho hover

### Ưu tiên 4 — Filter / sort

- [ ] Thêm filter theo nhóm skill
- [ ] Thêm sort theo usage / project / recent
- [ ] Chọn mặc định hợp lý
- [ ] Kiểm tra trải nghiệm khi lọc nhiều lần

---

## 8. Checklist kiểm tra UX sau khi sửa

- [ ] Người dùng có hiểu ngay đây là trang Skills gắn với project thật không?
- [ ] Người dùng có nhìn thấy tên skill trước tiên không?
- [ ] Người dùng có hiểu usage đang đo cái gì không?
- [ ] Người dùng có thấy rõ số project đã dùng skill đó không?
- [ ] Hover / popover có giúp hiểu hơn thay vì làm rối hơn không?
- [ ] Người dùng có thể phân biệt rõ skill và project evidence không?
- [ ] Filter / sort có thực sự giúp tìm nhanh hơn không?
- [ ] Giao diện tổng thể có dễ đọc hơn phiên bản hiện tại không?

---

## 9. Chốt định hướng

Định hướng nên theo là:

- bỏ **Projects** khỏi navbar để menu gọn hơn
- giữ **project** như lớp bằng chứng nằm trong **Skills**
- làm card skill rõ hơn, sạch hơn, dễ quét hơn
- dùng **hover / popover** để hiện project đã từng dùng skill đó
- thêm **filter / sort** để người dùng khám phá nhanh hơn

Như vậy trang Skills sẽ không chỉ là nơi liệt kê công nghệ, mà còn là nơi cho thấy **bạn đã dùng công nghệ đó trong dự án nào và ở mức độ nào**.
