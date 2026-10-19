"""
agent.py - chạy trong mạng LAN của trường, bật/tắt máy lạnh theo lịch đã kích hoạt trên web.

Agent CHỈ gọi ra ngoài (HTTPS tới web), không mở port nào. Mỗi 30 giây:
  1. GET  /api/ac-agent/plan       -> lấy các lệnh hôm nay đang chờ (kiêm heartbeat)
  2. Kiểm tra lại từng lệnh tới giờ (ngày, E1, giờ trễ, tạm dừng, chạy thử...)
  3. POST /api/ac-agent/jobs/<id>  -> "nhận" lệnh (RUNNING), gửi tới iTM, báo kết quả
Web không tin agent và agent không tin web: cả hai đều kiểm tra.

Biến môi trường:
  AC_API_BASE      https://ten-mien-cua-ban   (bắt buộc)
  AC_AGENT_TOKEN   token tạo ở /dashboard/tools/ac (bắt buộc)
  ITM_USER, ITM_PASS[_192_168_91_13]   tài khoản iTM (xem itm_client.py)
  ITM_FAKE=1       không gọi iTM thật, giả lập máy lạnh (để thử ở nhà)
  AC_POLL_SECONDS  mặc định 30

Chạy:  python agent.py          (Ctrl+C để dừng)
       python agent.py --once   (chạy 1 vòng rồi thoát, để thử)
"""
import logging
import logging.handlers
import os
import sys
import time
from datetime import datetime, timedelta, timezone

import requests

from itm_client import ITMClient

VN = timezone(timedelta(hours=7))          # Việt Nam không đổi giờ mùa hè
BUILDING_PREFIX = "E1-"
MAX_ATTEMPTS = 3                           # 1 lần + thử lại 2 lần
GAP_BETWEEN_UNITS = 3                      # giây giữa 2 máy, tránh khởi động dồn
MAX_CLOCK_SKEW = timedelta(minutes=5)

log = logging.getLogger("ac-agent")


# ---------- quy tắc (giống src/tools/ac-scheduler/plan.ts) ----------

def minutes_of(dt):
    local = dt.astimezone(VN)
    return local.hour * 60 + local.minute


def classify_turn_on(now_min, on_at_min, off_at_min, min_remaining):
    """("scheduled"|"late"|"too-late", số phút trễ) - giống classifyTurnOn."""
    if now_min <= on_at_min:
        return "scheduled", 0
    if off_at_min - now_min < min_remaining:
        return "too-late", 0
    return "late", now_min - on_at_min


def parse_iso(text):
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def describe(job):
    return f'{job["unit"]["name"]} ({", ".join(job["roomCodes"])})'


def decide(job, plan, now):
    """Trả về ("wait"|"run"|"skip", ghi chú) cho 1 lệnh đang PENDING."""
    config = plan["config"]
    unit = job["unit"]
    run_at = parse_iso(job["runAt"])

    if not unit["roomCodes"] or not all(r.startswith(BUILDING_PREFIX) for r in job["roomCodes"]):
        return "skip", f"Bỏ qua {describe(job)}: không phải phòng {BUILDING_PREFIX[:-1]}."
    if now < run_at:
        return "wait", ""

    now_min = minutes_of(now)
    window_end_min = minutes_of(parse_iso(job["windowEnd"]))

    if job["action"] == "ON":
        kind, late = classify_turn_on(now_min, minutes_of(run_at), window_end_min,
                                      config["minRemainingMinutes"])
        if kind == "too-late":
            return "skip", (f"Không bật {describe(job)}: còn chưa tới "
                            f'{config["minRemainingMinutes"]} phút là hết giờ học.')
        return "run", (f", trễ {late} phút" if kind == "late" and late > 2 else "")

    # Tắt: không tắt nếu máy sắp phải bật lại cho ca tiếp theo
    lead = timedelta(minutes=config["leadMinutes"])
    for other in plan["jobs"]:
        if (other["id"] != job["id"] and other["action"] == "ON"
                and other["status"] == "PENDING" and other["unit"]["id"] == unit["id"]
                and parse_iso(other["runAt"]) <= now + lead
                and parse_iso(other["windowEnd"]) > now):
            return "skip", f"Không tắt {describe(job)}: phòng còn ca tiếp theo."
    late = int((now - run_at).total_seconds() // 60)
    return "run", (f", trễ {late} phút" if late > 2 else "")


# ---------- gọi web ----------

class Api:
    def __init__(self, base, token):
        self.base = base.rstrip("/")
        self.s = requests.Session()
        self.s.headers["Authorization"] = f"Bearer {token}"

    def plan(self):
        r = self.s.get(f"{self.base}/api/ac-agent/plan", timeout=20)
        r.raise_for_status()
        return r.json()

    def job(self, job_id, status, result=None, level=None, is_running=None):
        """False nếu server từ chối (lệnh đã bị huỷ, đang tạm dừng, khác ngày...)."""
        body = {"status": status, "result": result}
        if level:
            body["level"] = level
        if is_running is not None:
            body["isRunning"] = is_running
        r = self.s.post(f"{self.base}/api/ac-agent/jobs/{job_id}", json=body, timeout=20)
        if r.status_code == 409:
            log.info("Server từ chối %s -> %s: %s", job_id, status, r.text[:200])
            return False
        r.raise_for_status()
        return True

    def event(self, message, level="INFO", unit_name=None):
        try:
            self.s.post(f"{self.base}/api/ac-agent/events",
                        json={"level": level, "message": message, "unitName": unit_name}, timeout=20)
        except requests.RequestException as e:
            log.warning("Không gửi được log lên web: %s", e)


# ---------- máy lạnh giả (ITM_FAKE=1) ----------

class FakeITMClient:
    trang_thai_may = {}

    def __init__(self, ip):
        self.ip = ip

    def login(self):
        log.info("[GIẢ] đăng nhập %s", self.ip)

    def logout(self):
        pass

    def dieu_khien(self, tang, may_idx, ten, bat):
        time.sleep(0.2)
        key = (self.ip, tang, may_idx)
        if self.trang_thai_may.get(key) == bat:
            return "already"
        self.trang_thai_may[key] = bat
        return "confirmed"


# ---------- vòng lặp ----------

class Agent:
    def __init__(self, api, client_cls):
        self.api = api
        self.client_cls = client_cls
        self.was_paused = None
        self.warned = set()

    def warn_once(self, key, message, level="WARN"):
        if key not in self.warned:
            self.warned.add(key)
            log.warning(message)
            self.api.event(message, level)

    def tick(self):
        plan = self.api.plan()
        now = datetime.now(timezone.utc)
        config = plan["config"]

        # Đồng hồ máy agent lệch -> không chạy gì cả
        if abs(parse_iso(plan["serverTime"]) - now) > MAX_CLOCK_SKEW:
            self.warn_once("skew", "Đồng hồ máy chạy agent lệch hơn 5 phút so với server - "
                                   "tạm không gửi lệnh. Hãy chỉnh giờ máy.", "ERROR")
            return
        if plan["todayKey"] != now.astimezone(VN).strftime("%Y-%m-%d"):
            self.warn_once(f'day-{plan["todayKey"]}', "Ngày trên server khác ngày trên máy agent - bỏ qua.")
            return

        if config["paused"] != self.was_paused:
            if config["paused"]:
                log.warning("Hệ thống đang DỪNG KHẨN CẤP - không gửi lệnh")
            self.was_paused = config["paused"]
        if config["paused"]:
            return

        # Lệnh RUNNING sót lại khi agent bị tắt giữa chừng -> trả về để chạy lại
        for job in plan["jobs"]:
            if job["status"] == "RUNNING":
                self.api.job(job["id"], "PENDING", "Agent khởi động lại, sẽ thử lại")
                job["status"] = "PENDING"

        due = []
        for job in plan["jobs"]:
            if job["status"] != "PENDING":
                continue
            verdict, note = decide(job, plan, now)
            if verdict == "skip":
                self.api.job(job["id"], "SKIPPED", note, "WARN")
            elif verdict == "run":
                due.append((job, note))

        # Tắt trước, bật sau; mỗi bộ iTM một phiên đăng nhập
        due.sort(key=lambda item: (item[0]["action"] != "OFF", item[0]["runAt"]))
        by_ip = {}
        for job, note in due:
            by_ip.setdefault(job["unit"]["itmIp"], []).append((job, note))
        for ip, items in by_ip.items():
            self.run_group(ip, items, config["dryRun"])

    def run_group(self, ip, items, dry_run):
        client = None
        try:
            for i, (job, note) in enumerate(items):
                if not self.api.job(job["id"], "RUNNING"):
                    continue                     # đã bị huỷ / tạm dừng giữa chừng
                bat = job["action"] == "ON"
                verb = "bật" if bat else "tắt"
                if dry_run:
                    self.api.job(job["id"], "DONE", f"CHẠY THỬ: sẽ {verb} {describe(job)}{note}.")
                    continue
                try:
                    if client is None:
                        client = self.client_cls(ip)
                        client.login()
                    if i:
                        time.sleep(GAP_BETWEEN_UNITS)
                    unit = job["unit"]
                    status = client.dieu_khien(unit["floorName"], unit["unitIndex"], unit["name"], bat)
                except Exception as e:           # noqa: BLE001 - mọi lỗi đều phải báo lên web
                    client = None                # phiên iTM có thể hỏng, đăng nhập lại lần sau
                    attempt = job["attempts"] + 1
                    if attempt < MAX_ATTEMPTS:
                        self.api.job(job["id"], "PENDING", f"Lỗi lần {attempt}: {e}. Sẽ thử lại.")
                        self.api.event(f"Lỗi khi {verb} {describe(job)} (lần {attempt}): {e}",
                                       "WARN", job["unit"]["name"])
                    else:
                        self.api.job(job["id"], "FAILED", f"Không {verb} được {describe(job)}: {e}")
                    continue
                if status == "confirmed":
                    self.api.job(job["id"], "DONE", f"Đã {verb} {describe(job)}{note}.", is_running=bat)
                elif status == "already":
                    self.api.job(job["id"], "DONE", f"{describe(job)} đã {verb} sẵn.", is_running=bat)
                else:
                    self.api.job(job["id"], "DONE",
                                 f"Đã gửi lệnh {verb} {describe(job)} nhưng chưa thấy máy xác nhận - "
                                 "cần kiểm tra lại.", "WARN")
        finally:
            if client is not None:
                client.logout()


def setup_logging():
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    file_handler = logging.handlers.RotatingFileHandler(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "agent.log"),
        maxBytes=2_000_000, backupCount=5, encoding="utf-8")
    file_handler.setFormatter(fmt)
    console = logging.StreamHandler()
    console.setFormatter(fmt)
    logging.basicConfig(level=logging.INFO, handlers=[file_handler, console])


def main():
    setup_logging()
    base, token = os.environ.get("AC_API_BASE"), os.environ.get("AC_AGENT_TOKEN")
    if not base or not token:
        raise SystemExit("Thiếu AC_API_BASE hoặc AC_AGENT_TOKEN (xem README.md).")

    fake = os.environ.get("ITM_FAKE") == "1"
    api = Api(base, token)
    agent = Agent(api, FakeITMClient if fake else ITMClient)
    poll = int(os.environ.get("AC_POLL_SECONDS", "30"))
    api.event(f"Agent khởi động{' (máy lạnh GIẢ LẬP)' if fake else ''}.")
    log.info("Agent chạy, hỏi web mỗi %ss%s", poll, " - ITM_FAKE" if fake else "")

    while True:
        try:
            agent.tick()
        except requests.RequestException as e:
            log.warning("Không kết nối được web: %s", e)
        except Exception:                        # noqa: BLE001 - agent không được chết
            log.exception("Lỗi không mong muốn")
        if "--once" in sys.argv:
            break
        time.sleep(poll)


if __name__ == "__main__":
    main()
