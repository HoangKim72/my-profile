# Đặc tả UI/UX cho chức năng Kết ca

## Mục tiêu

Bạn muốn đổi button "Ưu tiên hiển thị kết quả" thành "Kết ca".

Khi bấm vào Kết ca, giao diện sẽ chuyển sang một chế độ khác:

- Ẩn toàn bộ phần:
  - tải file
  - 2 bảng kết quả
  - thông tin đã lọc
  - các khối liên quan đến chế độ xử lý lịch học
- Hiển thị một khối nội dung tổng kết ca
- Cho phép chọn ca sáng hoặc ca chiều
- Cho phép người dùng bấm tăng/giảm số lượng cho từng nhóm
- Với một số nhóm, khi tăng số lượng thì sinh ra ô nhập nội dung chi tiết

---

## Ý tưởng UX tổng thể

Bạn nên xem đây là một chế độ hiển thị riêng trong cùng 1 page.

Nghĩa là page sẽ có 2 mode:

1. Mode xử lý lịch học
   - upload file
   - đặt báo thức
   - 2 bảng
   - thông tin đã lọc
   - thống kê

2. Mode kết ca
   - ẩn toàn bộ phần trên
   - chỉ hiện giao diện tổng kết ca

Cách này giúp:

- không làm giao diện rối
- người dùng hiểu rõ mình đang ở chế độ nào
- code dễ quản lý hơn

---

## Đề xuất đổi tên button

Đổi từ:

```text
Ưu tiên hiển thị kết quả
```

thành:

```text
Kết ca
```

Tôi khuyên nên đặt cạnh nút trạng thái như hiện tại, nhưng style khác đi một chút để người dùng hiểu đây là nút chuyển chế độ.

Ví dụ:

- Sẵn sàng sử dụng = badge trạng thái
- Kết ca = button hành động

---

## Hành vi của button Kết ca

### Khi bấm lần đầu

- chuyển `mode = "shift-summary"`
- ẩn các khối:
  - Upload
  - Đặt báo thức
  - Bảng 1
  - Bảng 2
  - Thông tin đã lọc
  - Thống kê đọc file nếu muốn
- hiện giao diện Kết ca

### Khi muốn quay lại

Nên có một trong 2 cách:

- nút Quay lại chế độ lọc
- hoặc button Kết ca trở thành toggle

Tôi khuyên dùng nút riêng:

```text
← Quay lại lọc lịch
```

vì rõ hơn.

---

## Nội dung cần hiển thị ở mode Kết ca

Phần text bạn muốn là:

```text
Kết ca A ngày XX:

- Có x phản hồi máy lạnh (y tăng, z giảm)
- Có e phản hồi phòng học:
- Đã cho mượn t vật tư
- Ca A sử dụng rr viên pin, phát sinh thêm p viên, tổng (rr+p) viên
```

Tôi khuyên không nên render nguyên một block text cứng ngay từ đầu, mà nên chia thành:

1. Header
2. Bộ chọn ca
3. Các dòng thống kê tương tác
4. Phần preview text kết ca ở dưới

Như vậy UX sẽ tốt hơn rất nhiều.

---

## Cấu trúc giao diện đề xuất

### 1. Header của chế độ kết ca

```text
Kết ca
Tổng hợp nhanh tình hình ca làm việc trong ngày.
```

### 2. Bộ chọn ca

Dùng 2 nút chọn:

- Ca sáng
- Ca chiều

Ví dụ:

- `ca sáng` => label hiển thị là `ca sáng`
- `ca chiều` => label hiển thị là `ca chiều`

Hoặc nếu bạn muốn trong text ghi là A/B, thì:

- ca sáng = A
- ca chiều = B

Tôi khuyên hiển thị trực tiếp:

```text
Kết ca sáng ngày 27/03/2026
```

sẽ dễ hiểu hơn `Kết ca A`.

Nếu vẫn muốn A/B:

- A = ca sáng
- B = ca chiều

---

## Dữ liệu cần quản lý

### Chế độ

```jsx
const [mode, setMode] = useState("filter");
```

### Ca được chọn

```jsx
const [shift, setShift] = useState("morning"); // morning | afternoon
```

### Ngày

```jsx
const [summaryDate, setSummaryDate] = useState("27/03/2026");
```

### Phản hồi máy lạnh

```jsx
const [acIncrease, setAcIncrease] = useState(0); // y
const [acDecrease, setAcDecrease] = useState(0); // z
```

Trong đó:

```jsx
const acTotal = acIncrease + acDecrease; // x
```

### Phản hồi phòng học

```jsx
const [roomFeedbackCount, setRoomFeedbackCount] = useState(0); // e
const [roomFeedbackDetails, setRoomFeedbackDetails] = useState([]);
```

### Vật tư cho mượn

```jsx
const [borrowedItemCount, setBorrowedItemCount] = useState(0); // t
const [borrowedItemDetails, setBorrowedItemDetails] = useState([]);
```

### Pin đã dùng / phát sinh thêm

```jsx
const [usedBatteryCount, setUsedBatteryCount] = useState(0); // rr
const [extraBatteryCount, setExtraBatteryCount] = useState(0); // p
```

```jsx
const totalBattery = usedBatteryCount + extraBatteryCount;
```

---

## Logic chi tiết theo yêu cầu

## 1. Phản hồi máy lạnh

Hiển thị:

```text
- Có x phản hồi máy lạnh (y tăng, z giảm)
```

Trong đó:

- `x = y + z`
- `y` và `z` khởi tạo là `0`
- người dùng không nhập trực tiếp
- chỉ tăng/giảm bằng nút bấm

### UI nên có

- Một block nhỏ gồm:
  - Tăng
  - Giảm
  - bộ đếm cho `y`
- Một block nhỏ gồm:
  - Tăng
  - Giảm
  - bộ đếm cho `z`

Ví dụ:

```text
Phản hồi máy lạnh
[Tăng +] [Tăng -] => 0
[Giảm +] [Giảm -] => 0
Tổng phản hồi: 0
```

### Logic

- `acIncrease >= 0`
- `acDecrease >= 0`
- không cho xuống âm

---

## 2. Phản hồi phòng học

Hiển thị ban đầu:

```text
- Có 0 phản hồi phòng học.
```

Khi tăng lên 1:

```text
- Có 1 phản hồi phòng học:
  + [ô nhập text]
```

Khi tăng lên 2:

```text
- Có 2 phản hồi phòng học:
  + [ô nhập text]
  + [ô nhập text]
```

### Ý tưởng dữ liệu

`roomFeedbackCount` là số lượng
`roomFeedbackDetails` là mảng các chuỗi

Ví dụ:

```jsx
["Phòng 07.2 quạt yếu", "Phòng 11.1 thiếu bút trình chiếu"];
```

### Hành vi cần có

- Nút tăng:
  - tăng `roomFeedbackCount`
  - thêm một chuỗi rỗng vào `roomFeedbackDetails`
- Nút giảm:
  - giảm `roomFeedbackCount`
  - xoá phần tử cuối trong `roomFeedbackDetails`

---

## 3. Vật tư cho mượn

Bạn nói `e, t cũng vậy`, nên phần vật tư cho mượn cũng cần:

- khởi tạo 0
- có nút tăng
- khi tăng thì sinh dòng nhập nội dung

Ví dụ:

```text
- Đã cho mượn 0 vật tư.
```

Khi tăng lên 1:

```text
- Đã cho mượn 1 vật tư:
  + [ô nhập text]
```

Ví dụ nội dung nhập:

- 2 dây HDMI
- 1 mic cài áo
- 1 adapter Type-C

### State

```jsx
const [borrowedItemCount, setBorrowedItemCount] = useState(0);
const [borrowedItemDetails, setBorrowedItemDetails] = useState([]);
```

---

## 4. Pin sử dụng

Hiển thị:

```text
- Ca A sử dụng rr viên pin, phát sinh thêm p viên, tổng (rr+p) viên
```

### Gợi ý UX

Phần này nên cho:

- nút tăng/giảm cho `rr`
- nút tăng/giảm cho `p`

Ví dụ:

```text
Pin sử dụng
Đã dùng: [-] 0 [+]
Phát sinh thêm: [-] 0 [+]
Tổng: 0
```

### State

```jsx
const [usedBatteryCount, setUsedBatteryCount] = useState(0);
const [extraBatteryCount, setExtraBatteryCount] = useState(0);
```

---

## Cách render text kết ca

Tôi khuyên nên có một block preview riêng, hiển thị văn bản hoàn chỉnh để người dùng dễ copy.

Ví dụ:

```text
Kết ca sáng ngày 27/03/2026:

- Có 3 phản hồi máy lạnh (2 tăng, 1 giảm)
- Có 1 phản hồi phòng học:
  + Phòng 07.2 quạt yếu
- Đã cho mượn 2 vật tư:
  + 1 dây HDMI
  + 1 adapter Type-C
- Ca sáng sử dụng 8 viên pin, phát sinh thêm 2 viên, tổng 10 viên
```

---

## Hàm generate text

Ví dụ:

```jsx
const shiftLabel = shift === "morning" ? "ca sáng" : "ca chiều";

const summaryText = `
Kết ${shiftLabel} ngày ${summaryDate}:

- Có ${acTotal} phản hồi máy lạnh (${acIncrease} tăng, ${acDecrease} giảm)
- Có ${roomFeedbackCount} phản hồi phòng học${
  roomFeedbackCount > 0
    ? `:
${roomFeedbackDetails.map((item) => `  + ${item || "(chưa nhập nội dung)"}`).join("\n")}`
    : "."
}
- Đã cho mượn ${borrowedItemCount} vật tư${
  borrowedItemCount > 0
    ? `:
${borrowedItemDetails.map((item) => `  + ${item || "(chưa nhập nội dung)"}`).join("\n")}`
    : "."
}
- ${shiftLabel.charAt(0).toUpperCase() + shiftLabel.slice(1)} sử dụng ${usedBatteryCount} viên pin, phát sinh thêm ${extraBatteryCount} viên, tổng ${usedBatteryCount + extraBatteryCount} viên
`.trim();
```

---

## Gợi ý UI card cho mode Kết ca

### Bố cục nên có

1. Header
2. Button chọn ca
3. Các block nhập liệu
4. Preview text
5. Nút copy nội dung

---

## Ví dụ bố cục JSX

```jsx
<div className="rounded-3xl border border-blue-500/20 bg-[#071126] p-6">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h2 className="text-3xl font-bold text-white">Kết ca</h2>
      <p className="mt-2 text-slate-400">
        Tổng hợp nhanh thông tin ca làm việc trong ngày.
      </p>
    </div>

    <button
      onClick={() => setMode("filter")}
      className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 hover:bg-slate-800"
    >
      Quay lại lọc lịch
    </button>
  </div>

  <div className="mt-6 flex gap-3">
    <button
      onClick={() => setShift("morning")}
      className={`rounded-xl px-4 py-2 ${shift === "morning" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}
    >
      Ca sáng
    </button>

    <button
      onClick={() => setShift("afternoon")}
      className={`rounded-xl px-4 py-2 ${shift === "afternoon" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}
    >
      Ca chiều
    </button>
  </div>

  <div className="mt-8 space-y-6">{/* Các block tăng giảm ở đây */}</div>

  <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-[#061a18] p-5">
    <h3 className="text-xl font-semibold text-white">Nội dung kết ca</h3>
    <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">
      {summaryText}
    </pre>
  </div>
</div>
```

---

## Logic tăng giảm cho các nhóm có chi tiết

### Tăng phản hồi phòng học

```jsx
const increaseRoomFeedback = () => {
  setRoomFeedbackCount((prev) => prev + 1);
  setRoomFeedbackDetails((prev) => [...prev, ""]);
};
```

### Giảm phản hồi phòng học

```jsx
const decreaseRoomFeedback = () => {
  setRoomFeedbackCount((prev) => Math.max(0, prev - 1));
  setRoomFeedbackDetails((prev) => prev.slice(0, -1));
};
```

### Cập nhật nội dung 1 dòng

```jsx
const updateRoomFeedbackDetail = (index, value) => {
  setRoomFeedbackDetails((prev) =>
    prev.map((item, i) => (i === index ? value : item)),
  );
};
```

### Tương tự cho vật tư cho mượn

```jsx
const increaseBorrowedItem = () => {
  setBorrowedItemCount((prev) => prev + 1);
  setBorrowedItemDetails((prev) => [...prev, ""]);
};

const decreaseBorrowedItem = () => {
  setBorrowedItemCount((prev) => Math.max(0, prev - 1));
  setBorrowedItemDetails((prev) => prev.slice(0, -1));
};

const updateBorrowedItemDetail = (index, value) => {
  setBorrowedItemDetails((prev) =>
    prev.map((item, i) => (i === index ? value : item)),
  );
};
```

---

## Điều tôi khuyên thêm

### 1. Nên dùng `textarea` thay vì `input` cho chi tiết

Vì phản hồi phòng học và vật tư có thể dài hơn 1 dòng.

Ví dụ:

```jsx
<textarea
  value={roomFeedbackDetails[index]}
  onChange={(e) => updateRoomFeedbackDetail(index, e.target.value)}
  className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-white"
  rows={2}
  placeholder={`Nội dung phản hồi phòng học #${index + 1}`}
/>
```

---

### 2. Nên có nút copy text

Rất hữu ích để copy nhanh nội dung kết ca sang Zalo, Messenger hoặc báo cáo.

```jsx
navigator.clipboard.writeText(summaryText);
```

Nút:

```text
Copy nội dung kết ca
```

---

### 3. Nên có ngày mặc định là ngày đang xử lý

Nếu tool đang lọc file cho ngày nào, mode Kết ca nên lấy luôn ngày đó để đỡ nhập lại.

---

### 4. Nên có xác nhận hiển thị rõ ca đang chọn

Ví dụ badge:

```text
Đang kết ca sáng
```

---

## Tóm tắt chức năng nên triển khai

### Button trên header tool

- Đổi "Ưu tiên hiển thị kết quả" thành "Kết ca"

### Khi bấm vào

- ẩn:
  - upload
  - báo thức
  - bảng 1
  - bảng 2
  - thông tin đã lọc
  - các khối kết quả lọc khác
- hiện:
  - giao diện kết ca

### Trong giao diện kết ca có:

- chọn ca sáng / ca chiều
- thống kê phản hồi máy lạnh:
  - tăng / giảm cho phần tăng
  - tăng / giảm cho phần giảm
- phản hồi phòng học:
  - tăng / giảm số lượng
  - sinh dòng nhập nội dung
- vật tư cho mượn:
  - tăng / giảm số lượng
  - sinh dòng nhập nội dung
- pin:
  - tăng / giảm số đã dùng
  - tăng / giảm số phát sinh thêm
- preview văn bản hoàn chỉnh
- nút copy nội dung
- nút quay lại chế độ lọc

---

## Kết luận

Thiết kế này hợp lý vì:

- không làm rối màn hình chính
- người dùng chỉ tập trung vào 1 nhiệm vụ mỗi lần
- dễ mở rộng sau này
- phù hợp quy trình làm việc thật

Nếu triển khai, tôi khuyên bạn làm theo thứ tự:

1. tạo `mode`
2. làm UI chuyển giữa `filter` và `shift-summary`
3. thêm chọn ca
4. thêm counter cho từng nhóm
5. render preview text
6. thêm nút copy
