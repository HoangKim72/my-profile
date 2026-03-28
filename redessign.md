# Đề xuất UI mới cho tool lọc mic

## Mục tiêu mới

Vì **bảng kết quả là phần chính**, còn **upload chỉ là bước phụ**, nên bố cục nên đổi theo hướng:

- Thu nhỏ card upload
- Đưa upload thành khu vực thao tác nhanh, không chiếm quá nhiều chiều cao
- Ưu tiên cho **Bảng 1** và **Bảng 2** xuất hiện sớm, nổi bật hơn
- Card **Đặt báo thức máy lạnh** đặt cạnh upload như một tiện ích phụ
- Thông báo **"Đã lọc xong file..."** đổi thành **toast nổi góc phải**, tự biến mất sau 5 giây

---

## Bố cục nên dùng

### Thứ tự hiển thị đề xuất

1. Tiêu đề tool
2. Hàng đầu tiên gồm 2 card phụ:
   - trái: **Upload lịch học**
   - phải: **Đặt báo thức máy lạnh**
3. Ngay bên dưới là **khu vực kết quả chính**
   - Bảng 1
   - Bảng 2
4. Sau đó mới tới:
   - thống kê
   - thông tin đọc file
5. Toast thành công hiển thị nổi ở góc phải màn hình

---

## Tư duy UI nên áp dụng

### 1. Upload là thao tác phụ
Người dùng vào trang này không phải để ngắm card upload, mà để:

- chọn file nhanh
- xem kết quả ngay
- thao tác tiếp với bảng

Vì vậy card upload nên:

- thấp hơn
- ngắn hơn
- ít text hơn
- chỉ đủ để chọn file và hiển thị trạng thái cơ bản

### 2. Bảng kết quả là trọng tâm
Phần bảng nên được đưa lên gần phía trên hơn để người dùng nhìn thấy ngay sau khi xử lý file.

Bạn có thể:

- tăng khoảng rộng cho bảng
- tăng độ tương phản phần tiêu đề bảng
- giảm “độ nặng” của các card phụ phía trên
- giữ 2 bảng ở vị trí trung tâm thị giác

---

## Layout khuyến nghị

### Khu phụ phía trên
Dùng grid 2 cột cho phần phụ:

- cột trái: upload
- cột phải: báo thức

Tỷ lệ nên là:

- Upload: 60%
- Báo thức: 40%

Ví dụ Tailwind:

```jsx
<div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
  <div className="xl:col-span-3">
    <UploadCard />
  </div>

  <div className="xl:col-span-2">
    <AlarmCard />
  </div>
</div>
```

---

## Khu kết quả chính

Đặt ngay dưới phần phụ:

```jsx
<div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
  <MorningMicTable />
  <NoonActionTable />
</div>
```

Nếu muốn nhấn mạnh hơn nữa, bạn có thể làm:

- bảng cao hơn card phụ
- tiêu đề bảng lớn hơn
- card bảng sáng hơn một chút so với card upload

---

## Gợi ý sửa card Upload

### Mục tiêu
Card này nên gọn, rõ, thao tác nhanh.

### Nên bỏ bớt
- mô tả quá dài
- badge không quá cần thiết
- khoảng trắng quá nhiều
- chiều cao vùng chọn file quá lớn

### Mẫu JSX
```jsx
function UploadCard() {
  return (
    <div className="rounded-2xl border border-blue-500/25 bg-[#071126] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Tải lịch học</h2>
          <p className="mt-1 text-sm text-slate-400">
            Chọn file Excel để lọc nhanh.
          </p>
        </div>

        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
          .XLS / .XLSX
        </span>
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-dashed border-blue-500/35 bg-slate-900/40 p-4">
        <div className="flex-1">
          <p className="font-medium text-white">Chọn file lịch học</p>
          <p className="text-sm text-slate-400">
            Xử lý ngay sau khi tải lên.
          </p>
        </div>

        <button className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500">
          Tải file
        </button>
      </div>
    </div>
  );
}
```

### Điểm mạnh của bản này
- card thấp hơn
- mắt người không bị kéo vào phần upload quá nhiều
- đủ chức năng nhưng không lấn át bảng kết quả

---

## Gợi ý sửa card Đặt báo thức

Card này cũng là phần phụ, nên thiết kế tương đồng với upload nhưng không quá nổi.

```jsx
function AlarmCard() {
  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-[#08182b] p-4 h-full">
      <h3 className="text-xl font-bold text-white">Đặt báo thức máy lạnh</h3>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        Phát hiện ca học từ 15h đến 16h. Có thể đặt thông báo để bật máy lạnh đúng giờ.
      </p>

      <div className="mt-3 rounded-xl bg-slate-900/40 p-3 text-sm text-slate-300">
        3 lịch học bắt đầu lúc 15h - 16h. Phòng liên quan: 03.1, 07.1, 12.2
      </div>

      <button className="mt-4 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500">
        Đặt báo thức
      </button>
    </div>
  );
}
```

---

## Gợi ý làm bảng kết quả nổi bật hơn

Vì đây là phần chính, bạn nên:

### Tăng độ ưu tiên thị giác
- tiêu đề bảng to hơn
- mô tả ngắn hơn
- nền bảng sáng hơn card phụ một chút
- tăng padding trong bảng
- dùng khoảng cách rõ giữa header và content

### Ví dụ class nên dùng
```jsx
<div className="rounded-3xl border border-slate-700 bg-[#091427] p-6 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]">
```

### Tiêu đề bảng
```jsx
<h3 className="text-3xl font-bold text-white">Bảng 1: Soạn mic ca sáng</h3>
<p className="mt-2 text-sm text-slate-400">
  Các phòng được nhóm theo tầng để chuẩn bị nhanh hơn.
</p>
```

---

## Toast thông báo thành công

### Không nên để trong luồng layout
Dòng:

> Đã lọc xong file cho ngày 27/03/2026.

nên đổi thành toast nổi ở góc phải, vì đây là thông báo tạm thời.

### Hành vi
- hiện góc phải trên
- tự ẩn sau 5 giây
- có thể bấm đóng

### JSX mẫu
```jsx
function SuccessToast({ show, message, onClose }) {
  if (!show) return null;

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="min-w-[320px] max-w-[420px] rounded-2xl border border-emerald-400/30 bg-[#06281f] px-4 py-3 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-emerald-300">{message}</p>
            <p className="mt-1 text-sm text-slate-300">
              File đã được xử lý thành công.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
```

### State xử lý
```jsx
const [showToast, setShowToast] = useState(false);
const [toastMessage, setToastMessage] = useState("");

const handleFilterDone = (date) => {
  setToastMessage(`Đã lọc xong file cho ngày ${date}.`);
  setShowToast(true);
};
```

### Tự ẩn sau 5 giây
```jsx
useEffect(() => {
  if (!showToast) return;

  const timer = setTimeout(() => {
    setShowToast(false);
  }, 5000);

  return () => clearTimeout(timer);
}, [showToast]);
```

---

## Bố cục tổng thể mẫu

```jsx
<div className="relative min-h-screen bg-[#030817]">
  <SuccessToast
    show={showToast}
    message={toastMessage}
    onClose={() => setShowToast(false)}
  />

  <div className="mx-auto max-w-7xl px-6 py-8">
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-white">Tool lọc mic</h1>
      <p className="mt-2 text-slate-400">
        Tải lịch học và xem nhanh danh sách phòng cần chuẩn bị mic.
      </p>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
      <div className="xl:col-span-3">
        <UploadCard />
      </div>

      <div className="xl:col-span-2">
        <AlarmCard />
      </div>
    </div>

    <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
      <MorningMicTable />
      <NoonActionTable />
    </div>

    <div className="mt-8">
      <StatsSection />
    </div>

    <div className="mt-8">
      <FileInfoSection />
    </div>
  </div>
</div>
```

---

## Kết luận

### Nên làm
- thu gọn upload thành card phụ
- đưa báo thức sang phải upload
- đưa 2 bảng kết quả lên sớm hơn
- chuyển thông báo thành toast nổi góc phải
- để ánh nhìn người dùng tập trung vào kết quả

### Không nên làm
- để card upload quá cao
- để thông báo thành công chiếm chỗ giữa layout
- để phần phụ nổi bật hơn phần bảng

---

## Ưu tiên triển khai

1. Sửa layout phần đầu thành 2 cột
2. Thu gọn card upload
3. Đưa toast ra góc phải
4. Tăng độ nổi bật cho 2 bảng
5. Sau cùng mới tinh chỉnh thống kê và thông tin file
