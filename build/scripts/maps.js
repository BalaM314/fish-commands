"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
Unfinished.
*/
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var funcs_1 = require("./funcs");
var FMap = /** @class */ (function () {
    function FMap(map) {
        this.map = map;
        this.runs = [];
    }
    FMap.read = function (data) {
        return funcs_1.StringIO.read(data, function (str) { return new FMap(null); }); //TODO
    };
    FMap.prototype.write = function () {
    };
    FMap.maps = {};
    return FMap;
}());
var PartialMapRun = /** @class */ (function () {
    function PartialMapRun() {
        this.startTime = Date.now();
        this.maxPlayerCount = 0;
    }
    /** In milliseconds */
    PartialMapRun.prototype.duration = function () {
        return Date.now() - this.startTime;
    };
    PartialMapRun.prototype.update = function () {
        this.maxPlayerCount = Math.max(this.maxPlayerCount, Groups.player.size());
    };
    PartialMapRun.prototype.finish = function (_a) {
        var winTeam = _a.winTeam;
        return {
            mapName: Vars.state.map.plainName(),
            winTeam: winTeam,
            success: winTeam == Vars.state.rules.defaultTeam,
            startTime: this.startTime,
            endTime: Date.now(),
            duration: Date.now() - this.startTime,
            maxPlayerCount: this.maxPlayerCount
        };
    };
    //Used for continuing through a restart
    PartialMapRun.prototype.write = function () {
        return "".concat(Date.now() - this.startTime, "/").concat(this.maxPlayerCount);
    };
    PartialMapRun.read = function (data) {
        var _a = __read(data.split("/").map(Number), 2), duration = _a[0], maxPlayerCount = _a[1];
        if (isNaN(duration) || isNaN(maxPlayerCount)) {
            Log.err("_FINDTAG_ failed to load map run stats data: ".concat(data));
        }
        var out = new PartialMapRun();
        out.startTime = Date.now() - duration; //subtract the time when the server was off
        out.maxPlayerCount = maxPlayerCount;
        return out;
    };
    return PartialMapRun;
}());
