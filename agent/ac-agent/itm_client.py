"""
itm_client.py - Điều khiển máy lạnh qua web Daikin iTM
Bản v0.11 - đăng nhập đã chạy thật trên 192.168.91.11. Bật/tắt CHƯA chạy thử thực tế.
Dùng làm thư viện cho agent.py (dieu_khien trả về chuỗi trạng thái).

Tài khoản: đặt biến môi trường trước khi chạy (CMD):
  set "ITM_USER=admin"
  set "ITM_PASS=mật_khẩu"
  Nếu mỗi bộ iTM có mật khẩu riêng: set "ITM_PASS_192_168_91_13=mật_khẩu_khác"

Các lệnh:
  python itm_client.py test 192.168.91.11      -> đăng nhập, liệt kê các tầng (chỉ đọc)
  python itm_client.py test 192.168.91.11 "TANG 3" -> thêm: chuyển sang TANG 3, đọc 6 vị trí đầu
  set ITM_DEBUG=1                               -> in nguyên văn lệnh gửi/nhận để gỡ lỗi
  python itm_client.py quet 192.168.91.11      -> quét tên máy từng tầng, ghi phong_map.csv (chỉ đọc)
  python itm_client.py taophong                -> tạo nháp phong_lich.csv (ghép phòng lịch học -> máy)
  python itm_client.py bat "E1-06-10 A"        -> BẬT 1 máy (tên iTM)
  python itm_client.py bat E1-06.10            -> BẬT cả phòng (mọi dàn lạnh, theo phong_lich.csv)
  python itm_client.py tat E1-06.10            -> TẮT cả phòng

Giao thức (giải mã từ script.js):
  POST /cmd/   Content-Type: text/plain   body: "snD=" + chuỗi hex
  Chuỗi hex = token(32) + screen(2B) + part(2B) + event(2B) + dataType(2B)
              + number(4B) + số phần tử mảng(2B) + [int 4B ...] + độ dài chuỗi(2B) + chuỗi
  Mỗi phản hồi trả về token mới ở 32 ký tự đầu -> request sau phải dùng token đó.
"""
import csv
import os
import re
import sys
import time
import hashlib
import logging
import requests

# Mã màn hình / sự kiện (lấy từ script.js)
SCR_LOGIN = 1203        # SCR_ID_WEB_003 - màn hình đăng nhập (token luôn = 32 số 0)
SCR_MAINMENU = 0        # menu chính (Menu List / Standard View / Layout View / Logoff)
SCR_LAYOUT = 3          # sơ đồ mặt bằng
SCR_OPERATION = 4       # cửa sổ Operation (On/Off, Setpoint...)
EVT_INIT, EVT_CLICK, EVT_TIMER, EVT_POLING = 0, 1, 3, 4
POLING_SCREENS = 31     # bitmask màn hình đang mở (menu|icon|list|layout|operation), như trình duyệt
DATA_NONE, DATA_INT, DATA_STRING, DATA_INTARRAY = 0, 1, 2, 8
CLIENT_VER = "Ver1.30.00"

# Thành phần trên giao diện (lấy từ log thao tác thật)
LOGIN_PART_BUTTON = 4
MENU_PART_LAYOUT_VIEW = 2   # nút "Layout View" (sau đăng nhập iTM mở Standard View)
MENU_PART_LOGOFF = 5        # nút "Logoff"
LAYOUT_PART_UNIT = 1    # chọn máy trên sơ đồ, number = thứ tự biểu tượng
LAYOUT_PART_FLOOR = 2   # chọn tầng, number = thứ tự trong danh sách tầng
LAYOUT_PART_OPEN_OP = 7 # mở cửa sổ Operation
LAYOUT_PART_FLOORLIST = 9
OP_PART_ONOFF = 9       # ô On/Off: 0 = Start, 1 = Stop
DLG_START = 22          # hộp thoại "Start?"        (Yes = click part 22)
DLG_STOP = 23           # hộp thoại "Confirm stop?" (Yes = click part 23)

MAP_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "phong_map.csv")
MAP_COLS = ["ip", "tang_idx", "tang", "may_idx", "ten"]
PHONG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "phong_lich.csv")

log = logging.getLogger("itm")


def _h16(v):  # short có dấu -> 4 ký tự hex
    return format(v & 0xFFFF, "04x")


def _h32(v):  # int có dấu -> 8 ký tự hex
    return format(v & 0xFFFFFFFF, "08x")


def doc_chuoi(resp, bat_dau):
    """Lấy các chuỗi có tiền tố độ dài (4 hex) mà nội dung bắt đầu bằng regex `bat_dau`."""
    kq = []
    for m in re.finditer(r"(?=([0-9a-f]{4})(" + bat_dau + "))", resp):
        n = int(m.group(1), 16)
        if 2 <= n <= 40:
            kq.append(resp[m.start() + 4: m.start() + 4 + n])
    return kq


def doc_ten_may_tang(resp):
    """Tên các máy trên sơ đồ tầng, theo thứ tự (mọi kiểu đặt tên)."""
    kq = []
    for m in re.finditer(r"0000000c([0-9a-f]{4})", resp):
        n = int(m.group(1), 16)
        ten = resp[m.end():m.end() + n]
        if 1 <= n <= 40 and ten.strip() and not ten.endswith(".jpg"):
            kq.append(ten)
    return kq


def doc_danh_sach_tang(resp):
    """Danh sách tầng theo đúng thứ tự (vị trí trong list = số gửi khi chọn tầng)."""
    m = re.search(r"0578([0-9a-f]{8})", resp)
    if m:
        n, pos, tangs = int(m.group(1), 16), m.end(), []
        try:
            for _ in range(n):
                L = int(resp[pos:pos + 4], 16)
                tangs.append(resp[pos + 4:pos + 4 + L])
                pos += 4 + L + 8                 # bỏ qua 2 số short đi kèm mỗi mục
            return tangs
        except ValueError:
            pass
    return doc_chuoi(resp, r"TANG")              # dự phòng


class ITMClient:
    def __init__(self, ip):
        self.ip = ip
        self.url = f"http://{ip}/cmd/"
        self.token = "0" * 32
        self.s = requests.Session()
        self.trang_thai = {}                     # trạng thái máy đang chọn (đọc từ phản hồi)

    # ---------- tầng giao thức ----------
    def send(self, screen, part, event=EVT_CLICK, dtype=DATA_NONE, number=-1,
             arr=(), text=""):
        if screen == SCR_LOGIN:
            self.token = "0" * 32           # trình duyệt cũng reset token ở màn đăng nhập
        body = (self.token + _h16(screen) + _h16(part) + _h16(event) + _h16(dtype)
                + _h32(number) + _h16(len(arr)) + "".join(_h32(x) for x in arr)
                + _h16(len(text)) + text)
        r = self.s.post(self.url, data=("snD=" + body).encode("utf-8"),
                        headers={"Content-Type": "text/plain"}, timeout=30)
        r.raise_for_status()
        r.encoding = "utf-8"                     # để đọc đúng "°C" và độ dài chuỗi
        resp = r.text
        if len(resp) >= 32:
            self.token = resp[:32]          # token mới cho lần gửi sau
        k = re.search(r"00090190([0-9a-f]{8})", resp)    # ô On/Off của máy đang chọn
        if k and int(k.group(1), 16) in (0, 1):
            self.trang_thai["dang_chay"] = int(k.group(1), 16) == 0
        if os.environ.get("ITM_DEBUG"):
            an = text if screen != SCR_LOGIN else "(ẩn)"
            with open(os.path.join(os.path.dirname(MAP_FILE), "itm_debug.log"), "a",
                      encoding="utf-8") as f:
                f.write(f">> screen={screen} part={part} ev={event} dt={dtype} "
                        f"num={number} text={an}\n<< {resp[32:]}\n\n")
        log.debug("SEND %s/%s ev=%s num=%s -> %s", screen, part, event, number, resp[:150])
        return resp

    # ---------- thao tác ----------
    def login(self, user=None, password=None):
        user = user or os.environ.get("ITM_USER", "")
        if password is None:
            password = os.environ.get("ITM_PASS_" + self.ip.replace(".", "_"),
                                      os.environ.get("ITM_PASS", ""))
        if not user:
            raise RuntimeError('Chưa đặt tài khoản. Gõ: set "ITM_USER=..." và set "ITM_PASS=..." '
                               "trong CÙNG cửa sổ CMD rồi chạy lại.")
        log.info("Đăng nhập %s với user '%s', mật khẩu dài %d ký tự",
                 self.ip, user, len(password))
        self.send(-1, -1, event=EVT_INIT, dtype=DATA_STRING, text=CLIENT_VER)
        digest = hashlib.sha256(password.encode()).hexdigest() if password else ""
        resp = self.send(SCR_LOGIN, LOGIN_PART_BUTTON, event=EVT_CLICK, dtype=DATA_STRING,
                         text=f"{len(user):04d}{user}{digest}")
        if "Could not log in" in resp or ("Layout" not in resp and "TANG" not in resp):
            chu = " | ".join(re.findall(r"[A-Za-z][A-Za-z .,?!'\n]{3,}", resp[32:]))[:300]
            raise RuntimeError(f"Đăng nhập {self.ip} thất bại. Thiết bị trả lời: {chu}")
        log.info("Đăng nhập %s thành công", self.ip)
        self.tangs = doc_danh_sach_tang(resp)
        # chuyển sang Layout View (sơ đồ tầng)
        r2 = self.send(SCR_MAINMENU, MENU_PART_LAYOUT_VIEW)
        self._cap_nhat_tang(r2)
        log.info("Sơ đồ đang mở: %s | danh sách bên phải: %s",
                 getattr(self, "tang_hien_tai", "?"), getattr(self, "ds_tang_phai", "?"))
        return resp

    def logout(self):
        """Bấm Logoff; nếu hiện hộp thoại xác nhận thì bấm nút đầu tiên (Yes/OK)."""
        try:
            resp = self.send(SCR_MAINMENU, MENU_PART_LOGOFF)
            m = re.search(r"00060000([0-9a-f]{4})", resp[32:])   # DLG_OPEN trên menu chính
            if m:
                self.send(SCR_MAINMENU, int(m.group(1), 16))
            log.info("Đã đăng xuất %s", self.ip)
        except Exception as e:                   # đăng xuất lỗi không được làm hỏng việc chính
            log.warning("Đăng xuất %s lỗi: %s", self.ip, e)

    @staticmethod
    def doc_tieu_de_tang(resp):
        """Tên tầng đang hiển thị (nhãn tiêu đề sơ đồ, ví dụ 'TANG 1')."""
        m = re.search(r"000000c8([0-9a-f]{4})(TANG|[^E])", resp[32:])
        if not m:
            return None
        st = m.start(1) + 4 + 32
        return resp[st:st + int(m.group(1), 16)]

    @staticmethod
    def doc_ds_tang_ben_phai(resp):
        """Danh sách tầng ở cột bên phải (không gồm tầng đang xem)."""
        m = re.search(r"00020259([0-9a-f]{4})([0-9a-f]{4})", resp)
        if not m:
            return None
        n, pos, ds = int(m.group(1), 16), m.end(), []
        try:
            for _ in range(n):
                L = int(resp[pos:pos + 4], 16)
                ds.append(resp[pos + 4:pos + 4 + L])
                pos += 4 + L + 8
        except ValueError:
            return None
        return ds

    def chon_tang(self, ten_tang):
        """Chuyển sơ đồ sang tầng `ten_tang`. Trả về phản hồi, hoặc None nếu không chuyển được."""
        if getattr(self, "tang_hien_tai", None) == ten_tang:
            return self.resp_tang
        ds = getattr(self, "ds_tang_phai", None) or []
        if ten_tang not in ds:
            log.warning("Không thấy '%s' trong danh sách tầng bên phải: %s", ten_tang, ds)
            return None
        # Danh sách tầng là CtList: gửi kiểu "mảng các mục được chọn"
        # (dataType=8, number = số mục = 1, mảng = [vị trí trong danh sách bên phải])
        resp = self.send(SCR_LAYOUT, LAYOUT_PART_FLOOR, dtype=DATA_INTARRAY, number=1,
                         arr=[ds.index(ten_tang)])
        self._cap_nhat_tang(resp)
        if self.tang_hien_tai != ten_tang:
            log.warning("Chọn '%s' nhưng sơ đồ đang là '%s'", ten_tang, self.tang_hien_tai)
            return None
        return resp

    def _cap_nhat_tang(self, resp):
        t = self.doc_tieu_de_tang(resp)
        if t:
            self.tang_hien_tai = t
            self.resp_tang = resp
        ds = self.doc_ds_tang_ben_phai(resp)
        if ds is not None:
            self.ds_tang_phai = ds

    def chon_may(self, may_idx):
        """Chọn máy trên sơ đồ, trả về tên máy đọc được (hoặc None).
        Phản hồi chỉ chứa những ô thay đổi so với máy chọn trước, nên trạng thái
        được cộng dồn vào self.trang_thai."""
        resp = self.send(SCR_LAYOUT, LAYOUT_PART_UNIT, dtype=DATA_INT, number=may_idx)
        m = re.search(r"000000c8([0-9a-f]{4})", resp[32:])     # nhãn tên trên cửa sổ Operation
        if not m:
            return None
        n = int(m.group(1), 16)
        st = m.end() + 32
        ten = resp[st:st + n]
        if not ten.strip():
            return None
        tt = self.trang_thai
        tt["ten"] = ten
        for khoa, pat in (("nhiet_do", r"000400c8([0-9a-f]{4})"), ("che_do", r"000500c8([0-9a-f]{4})")):
            k = re.search(pat, resp)
            if k:
                tt[khoa] = resp[k.end():k.end() + int(k.group(1), 16)]
        k = re.search(r"00090190([0-9a-f]{8})", resp)           # ô On/Off: mục đang chọn
        if k:
            tt["dang_chay"] = int(k.group(1), 16) == 0          # 0 = Start, 1 = Stop
        return ten

    def quet(self, so_thu_toi_da=12):
        """Chỉ đọc. Mỗi tầng trả về danh sách máy; mỗi máy chiếm 2 vị trí trên sơ đồ
        (biểu tượng + nhãn chữ). Ta chọn thử để xác nhận đúng vị trí của từng máy."""
        rows = []
        for ti, tname in enumerate(self.tangs):
            if tname.lower() == "all":
                continue
            resp = self.chon_tang(tname)
            if resp is None:
                print(f"{tname}: KHÔNG chuyển được tầng - bỏ qua")
                continue
            ds_ten = doc_ten_may_tang(resp)
            print(f"{tname}: {len(ds_ten)} máy {ds_ten}")
            idx = 0
            for ten in ds_ten:
                tim_thay = None
                for thu in range(idx, idx + so_thu_toi_da):
                    if self.chon_may(thu) == ten:
                        tim_thay = thu
                        break
                if tim_thay is None:
                    log.warning("  Không xác định được vị trí của %s", ten)
                    continue
                tt = self.trang_thai
                rows.append({"ip": self.ip, "tang_idx": ti, "tang": tname,
                             "may_idx": tim_thay, "ten": ten})
                print(f"  may_idx={tim_thay:<4} {ten:16} "
                      f"{'ĐANG CHẠY' if tt.get('dang_chay') else 'đang tắt':10} "
                      f"{tt.get('nhiet_do', '')} {tt.get('che_do', '')}")
                idx = tim_thay + 1
        return rows

    def dieu_khien(self, tang, may_idx, ten, bat: bool):
        """Bật/tắt 1 máy. Trả về "confirmed" (thiết bị xác nhận), "unconfirmed"
        (đã gửi, chưa thấy xác nhận) hoặc "already" (máy đã ở trạng thái đó).
        Lỗi (sai tầng, sai tên máy...) thì raise."""
        if self.chon_tang(tang) is None:
            raise RuntimeError(f"Không chuyển được sang {tang}")
        ten_doc = self.chon_may(may_idx)
        if ten_doc != ten:                       # An toàn 1: đúng máy mới làm tiếp
            raise RuntimeError(f"Chọn nhầm máy: mong '{ten}', đọc được '{ten_doc}'")
        self.send(SCR_LAYOUT, LAYOUT_PART_OPEN_OP)
        resp = self.send(SCR_OPERATION, OP_PART_ONOFF, dtype=DATA_INT,
                         number=0 if bat else 1)
        cho_chu, dlg = ("Start?", DLG_START) if bat else ("Confirm stop?", DLG_STOP)
        if cho_chu not in resp:                  # An toàn 2: đúng hộp thoại mới bấm Yes
            log.info("%s: không thấy hộp thoại '%s' (có thể máy đã ở trạng thái đó)",
                     ten, cho_chu)
            return "already"
        self.send(SCR_OPERATION, dlg, event=EVT_CLICK)
        # Giống trình duyệt (ScMainOperation.sendOperation): gửi TIMER cho cửa sổ Operation,
        # rồi hỏi trạng thái vài lần để lệnh kịp xuống máy và đọc kết quả.
        self.send(SCR_OPERATION, -1, event=EVT_TIMER)
        ok = None
        for _ in range(8):
            time.sleep(2)
            self.send(-1, -1, event=EVT_POLING, number=POLING_SCREENS)
            self.send(SCR_OPERATION, -1, event=EVT_TIMER)
            if self.trang_thai.get("dang_chay") == bat:
                ok = True
                break
        if ok:
            log.info("%s: ĐÃ %s (thiết bị xác nhận)", ten, "BẬT" if bat else "TẮT")
            return "confirmed"
        log.warning("%s: đã gửi lệnh %s nhưng chưa thấy thiết bị xác nhận - kiểm tra lại trên web",
                    ten, "BẬT" if bat else "TẮT")
        return "unconfirmed"


# ---------- bảng phòng ----------
def doc_bang_phong():
    """Trả về {tên máy: [dòng, dòng...]} - một tên có thể ứng với nhiều dàn lạnh."""
    kq = {}
    if os.path.exists(MAP_FILE):
        with open(MAP_FILE, encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                kq.setdefault(r["ten"], []).append(r)
    return kq


def ghi_bang_phong(rows, ip):
    try:
        open(MAP_FILE, "a").close()
    except PermissionError:
        raise SystemExit(f"Không ghi được {MAP_FILE} - hãy ĐÓNG file này trong Excel rồi chạy lại.")
    cu = [r for ds in doc_bang_phong().values() for r in ds if r["ip"] != ip]
    with open(MAP_FILE, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=MAP_COLS)
        w.writeheader()
        w.writerows(cu + rows)


def chuan_hoa_phong(ten_itm):
    """Đoán tên phòng theo lịch học từ tên máy iTM, vd 'E1-03-05 A' -> 'E1-03.05'."""
    m = re.match(r"\s*E\s*(\d+)\s*-\s*(\d{1,2})\s*[-.]\s*(\d{2})", ten_itm, re.I)
    return f"E{m.group(1)}-{int(m.group(2)):02d}.{m.group(3)}" if m else ""


def tao_bang_phong_lich():
    """Tạo bản nháp phong_lich.csv: mỗi dòng = 1 dàn lạnh, cột phong_lich để ghép với lịch học."""
    if os.path.exists(PHONG_FILE):
        raise SystemExit(f"{PHONG_FILE} đã có - xóa hoặc đổi tên file cũ nếu muốn tạo lại.")
    rows = [r for ds in doc_bang_phong().values() for r in ds]
    with open(PHONG_FILE, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["phong_lich", "ten_itm", "ghi_chu"])
        for r in rows:
            p = chuan_hoa_phong(r["ten"])
            w.writerow([p, r["ten"], "" if p else "CẦN ĐIỀN TAY (hoặc để trống nếu không theo lịch)"])
    print(f"Đã tạo {PHONG_FILE} - mở bằng Excel để kiểm tra cột phong_lich.")


def doc_bang_phong_lich():
    """{phòng theo lịch: [tên máy iTM, ...]}"""
    kq = {}
    if os.path.exists(PHONG_FILE):
        with open(PHONG_FILE, encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                if r["phong_lich"].strip():
                    kq.setdefault(r["phong_lich"].strip(), []).append(r["ten_itm"])
    return kq


def bat_phong(phong):
    """Bật tất cả dàn lạnh của 1 phòng (tên theo lịch học) hoặc 1 máy (tên iTM)."""
    return sum(_dk(t, True) for t in doc_bang_phong_lich().get(phong, [phong]))


def tat_phong(phong):
    return sum(_dk(t, False) for t in doc_bang_phong_lich().get(phong, [phong]))


def bat_may(ten):
    return _dk(ten, True)


def tat_may(ten):
    return _dk(ten, False)


def _dk(ten, bat):
    """Bật/tắt TẤT CẢ dàn lạnh mang tên `ten`. Trả về số dàn đã gửi lệnh."""
    ds = doc_bang_phong().get(ten)
    if not ds:
        raise KeyError(f"Không có '{ten}' trong {MAP_FILE}. Chạy lệnh quet trước.")
    so_lenh = 0
    theo_ip = {}
    for r in ds:
        theo_ip.setdefault(r["ip"], []).append(r)
    for ip, rows in theo_ip.items():
        c = ITMClient(ip)
        c.login()
        try:
            for r in rows:
                try:
                    if c.dieu_khien(r["tang"], int(r["may_idx"]), ten, bat) != "already":
                        so_lenh += 1
                except Exception as e:
                    log.error("%s (may_idx=%s): %s", ten, r["may_idx"], e)
        finally:
            c.logout()
    log.info("%s: %d/%d dàn lạnh đã nhận lệnh %s", ten, so_lenh, len(ds),
             "BẬT" if bat else "TẮT")
    return so_lenh


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
    a = sys.argv[1:]
    if len(a) >= 2 and a[0] == "test":
        c = ITMClient(a[1])
        c.login()
        for i, t in enumerate(c.tangs):
            print(f"  tang_idx={i:<3} {t}")
        if len(a) >= 3:                          # test <ip> <tang_idx>: thử chọn 6 vị trí đầu
            c.chon_tang(a[2])
            for mi in range(6):
                print(f"  may_idx={mi}: {c.chon_may(mi)}  {c.trang_thai}")
        c.logout()
    elif len(a) >= 2 and a[0] == "quet":
        for ip in a[1:]:
            c = ITMClient(ip)
            c.login()
            try:
                rows = c.quet()
            finally:
                c.logout()
            ghi_bang_phong(rows, ip)
            print(f"{ip}: tìm thấy {len(rows)} máy, đã ghi {MAP_FILE}")
    elif len(a) == 1 and a[0] == "taophong":
        tao_bang_phong_lich()
    elif len(a) == 2 and a[0] in ("bat", "tat"):
        bat_phong(a[1]) if a[0] == "bat" else tat_phong(a[1])
    else:
        print(__doc__)
