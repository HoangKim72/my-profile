# ac-agent: bật/tắt máy lạnh E1 theo lịch

Web (`/tools/ac`) chạy trên Vercel và **không gọi được** vào mạng nội bộ của trường (`192.168.91.x`).
Agent này chạy trên một PC luôn bật **trong LAN của trường**. Nó tự gọi ra web để lấy lệnh, rồi điều khiển
máy lạnh qua giao diện Daikin iTM. Không cần mở port, không cần VPN.

```
Trình duyệt ──► Web (Vercel) ──► Supabase (lịch, lệnh, log, Realtime)
                                     ▲
                       HTTPS ra ngoài │ mỗi 30s
                                     │
              PC trong LAN: agent.py ──► iTM 192.168.91.x ──► máy lạnh
```

## Cài đặt (Windows)

1. Cài Python 3.10+ (tick "Add to PATH").
2. Chép thư mục `agent/ac-agent` sang PC đó, mở CMD trong thư mục:
   ```bat
   pip install -r requirements.txt
   ```
3. Admin vào `/dashboard/tools/ac` → **Tạo token** → copy token (chỉ hiện 1 lần).
4. Lập danh sách máy:
   ```bat
   set "ITM_USER=admin"
   set "ITM_PASS=..."
   python itm_client.py quet 192.168.91.11 192.168.91.13
   ```
   Mở `phong_map.csv`, thêm cột `phong` (mã phòng trong lịch, vd `E1-12.02`; module lầu 4/10 như
   `E1-04.05/1`), rồi dán vào ô **Danh sách máy** ở `/dashboard/tools/ac`. Máy nào không ghi phòng sẽ
   không bao giờ được bật tự động (vd sân bóng chuyền E1-12.01).

## Chạy thử

```bat
set "AC_API_BASE=https://ten-mien-cua-ban"
set "AC_AGENT_TOKEN=acag_..."
set "ITM_FAKE=1"
python agent.py
```

`ITM_FAKE=1` giả lập máy lạnh, không gọi iTM. Kết hợp với **Chạy thử** (bật sẵn ở dashboard) để xem
log "CHẠY THỬ: sẽ bật ..." hiện trực tiếp trên `/tools/ac`.

Test không cần mạng: `python -m unittest test_agent`.

## Lần chạy thật đầu tiên

1. Giữ **Chạy thử** bật, bỏ `ITM_FAKE`, để agent chạy 1 ngày, đối chiếu log với lịch.
2. Danh sách máy chỉ để **1 máy** (E1-12.02), tắt **Chạy thử**, có người đứng ở phòng xem.
3. Ổn rồi mới thêm các máy khác.

## Chạy nền khi khởi động máy

Dùng [NSSM](https://nssm.cc/) (khuyên dùng, tự khởi động lại khi lỗi):

```bat
nssm install ac-agent "C:\Python312\python.exe" "C:\ac-agent\agent.py"
nssm set ac-agent AppDirectory "C:\ac-agent"
nssm set ac-agent AppEnvironmentExtra AC_API_BASE=https://... AC_AGENT_TOKEN=acag_... ITM_USER=admin ITM_PASS=...
nssm start ac-agent
```

Log nằm ở `agent.log` (tự xoay vòng, tối đa ~10MB).

## Các kiểm tra an toàn của agent

Trước **mỗi** lệnh, agent kiểm tra lại (không tin hoàn toàn vào web):

- Đồng hồ máy lệch server quá 5 phút → không gửi gì, báo đỏ trên web.
- Ngày trên server khác ngày trên máy → bỏ qua.
- **Dừng khẩn cấp** đang bật → không gửi gì.
- Phòng không phải E1 → bỏ qua.
- Bật trễ: còn ≥ 30 phút (cấu hình được) trước giờ kết thúc thì bật ngay, ít hơn thì bỏ qua.
- Tắt: không tắt nếu máy sắp phải bật lại cho ca kế tiếp.
- "Nhận" lệnh trên server trước khi gửi (lệnh vừa bị huỷ trên web sẽ không chạy).
- `itm_client.py` kiểm tra đúng tên máy và đúng hộp thoại "Start?/Confirm stop?" rồi đọc lại trạng thái.
- Lỗi thì thử lại tối đa 3 lần, sau đó báo **Lỗi** trên web.
- Gửi lần lượt từng máy, cách nhau 3 giây.

Chỉ chạy **một** agent cho mỗi hệ thống.
