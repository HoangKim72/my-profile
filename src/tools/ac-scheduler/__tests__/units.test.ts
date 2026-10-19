import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatAcUnitsCsv, parseAcUnitsCsv } from "@/tools/ac-scheduler/units";

describe("parseAcUnitsCsv", () => {
  it("reads phong_map.csv columns plus the room column", () => {
    const units = parseAcUnitsCsv(
      "﻿ip,tang_idx,tang,may_idx,ten,phong\n" +
        "192.168.91.13,0,TANG 13,0,E1-12-02 A,E1-12.02\n" +
        "192.168.91.11,2,TANG 4,3,E1-04-01,e1-04.05/1 | E1-04.05/2\n" +
        "192.168.91.11,2,TANG 4,5,E1-04-99,\n",
    );

    assert.equal(units.length, 3);
    assert.deepEqual(units[0], {
      itmIp: "192.168.91.13",
      floorName: "TANG 13",
      unitIndex: 0,
      name: "E1-12-02 A",
      roomCodes: ["E1-12.02"],
    });
    assert.deepEqual(units[1].roomCodes, ["E1-04.05/1", "E1-04.05/2"]);
    assert.deepEqual(units[2].roomCodes, []);
  });

  it("accepts Excel's semicolon CSV", () => {
    const units = parseAcUnitsCsv("ip;tang;may_idx;ten;phong\n192.168.91.13;TANG 13;0;E1-12-02;E1-12.02");
    assert.equal(units[0].name, "E1-12-02");
  });

  it("refuses rooms outside E1 and duplicate positions", () => {
    assert.throws(() => parseAcUnitsCsv("ip,tang,may_idx,ten,phong\n192.168.91.13,TANG 13,0,X,E2-07.01"), /E2-07.01/);
    assert.throws(
      () => parseAcUnitsCsv("ip,tang,may_idx,ten\n192.168.91.13,TANG 13,0,A\n192.168.91.13,TANG 13,0,B"),
      /trùng/,
    );
    assert.throws(() => parseAcUnitsCsv("ip,tang,may_idx,ten\nabc,TANG 13,0,A"), /IP/);
  });

  it("round-trips through formatAcUnitsCsv", () => {
    const units = parseAcUnitsCsv("ip,tang,may_idx,ten,phong\n192.168.91.11,TANG 4,3,\"E1-04-01, A\",E1-04.05/1 E1-04.05/2");
    assert.deepEqual(parseAcUnitsCsv(formatAcUnitsCsv(units)), units);
  });
});
