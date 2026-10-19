"""python -m unittest test_agent   (không cần mạng, không cần iTM)"""
import unittest
from datetime import datetime, timedelta, timezone

import agent as ag

VN = ag.VN


def at(hh, mm):
    return datetime(2026, 10, 20, hh, mm, tzinfo=VN).astimezone(timezone.utc)


def iso(dt):
    return dt.isoformat().replace("+00:00", "Z")


def job(job_id="j1", action="ON", run=(17, 40), end=(20, 30), rooms=("E1-12.02",), unit_id="u1",
        status="PENDING", attempts=0):
    return {
        "id": job_id, "action": action, "status": status, "attempts": attempts,
        "runAt": iso(at(*run)), "windowStart": iso(at(18, 0)), "windowEnd": iso(at(*end)),
        "roomCodes": list(rooms),
        "unit": {"id": unit_id, "name": "E1-12-02", "itmIp": "192.168.91.13", "floorName": "TANG 13",
                 "unitIndex": 0, "roomCodes": list(rooms)},
    }


def plan(jobs, now, **config):
    base = {"leadMinutes": 20, "minRemainingMinutes": 30, "maxConcurrentUnits": 30,
            "paused": False, "dryRun": False}
    base.update(config)
    return {"serverTime": iso(now), "todayKey": "2026-10-20", "config": base, "jobs": jobs}


class ClassifyTest(unittest.TestCase):
    def test_matches_web_rules(self):
        self.assertEqual(ag.classify_turn_on(540, 1060, 1230, 30), ("scheduled", 0))
        self.assertEqual(ag.classify_turn_on(1080, 1060, 1230, 30), ("late", 20))
        self.assertEqual(ag.classify_turn_on(1201, 1060, 1230, 30), ("too-late", 0))


class DecideTest(unittest.TestCase):
    def test_waits_until_run_time(self):
        j = job()
        self.assertEqual(ag.decide(j, plan([j], at(17, 0)), at(17, 0))[0], "wait")

    def test_runs_late_with_note(self):
        j = job()
        verdict, note = ag.decide(j, plan([j], at(18, 10)), at(18, 10))
        self.assertEqual(verdict, "run")
        self.assertIn("trễ 30 phút", note)

    def test_skips_when_too_late(self):
        j = job()
        self.assertEqual(ag.decide(j, plan([j], at(20, 10)), at(20, 10))[0], "skip")

    def test_skips_rooms_outside_e1(self):
        j = job(rooms=("E2-07.01",))
        self.assertEqual(ag.decide(j, plan([j], at(18, 0)), at(18, 0))[0], "skip")

    def test_does_not_turn_off_before_next_class(self):
        off = job("off", action="OFF", run=(11, 40), end=(11, 40))
        nxt = job("on2", action="ON", run=(11, 50), end=(16, 40))
        self.assertEqual(ag.decide(off, plan([off, nxt], at(11, 40)), at(11, 40))[0], "skip")
        self.assertEqual(ag.decide(off, plan([off], at(11, 40)), at(11, 40))[0], "run")


class FakeApi:
    def __init__(self, data):
        self.data = data
        self.calls = []
        self.events = []

    def plan(self):
        return self.data

    def job(self, job_id, status, result=None, level=None, is_running=None):
        self.calls.append((job_id, status, result, is_running))
        return True

    def event(self, message, level="INFO", unit_name=None):
        self.events.append((level, message))


class TickTest(unittest.TestCase):
    def setUp(self):
        ag.FakeITMClient.trang_thai_may = {}
        self._now = ag.datetime

    def run_tick(self, data, now):
        class FrozenDatetime(datetime):
            @classmethod
            def now(cls, tz=None):
                return now.astimezone(tz) if tz else now

        ag.datetime = FrozenDatetime
        try:
            api = FakeApi(data)
            ag.Agent(api, ag.FakeITMClient).tick()
            return api
        finally:
            ag.datetime = self._now

    def test_dry_run_only_logs(self):
        api = self.run_tick(plan([job()], at(17, 41), dryRun=True), at(17, 41))
        self.assertEqual([c[1] for c in api.calls], ["RUNNING", "DONE"])
        self.assertIn("CHẠY THỬ", api.calls[1][2])
        self.assertEqual(ag.FakeITMClient.trang_thai_may, {})

    def test_turns_unit_on_and_reports_state(self):
        api = self.run_tick(plan([job()], at(17, 41)), at(17, 41))
        self.assertEqual(api.calls[-1][1], "DONE")
        self.assertTrue(api.calls[-1][3])

    def test_paused_sends_nothing(self):
        api = self.run_tick(plan([job()], at(17, 41), paused=True), at(17, 41))
        self.assertEqual(api.calls, [])

    def test_clock_skew_blocks_commands(self):
        data = plan([job()], at(17, 41))
        api = self.run_tick(data, at(17, 41) + timedelta(minutes=10))
        self.assertEqual(api.calls, [])
        self.assertEqual(api.events[0][0], "ERROR")


if __name__ == "__main__":
    unittest.main()
