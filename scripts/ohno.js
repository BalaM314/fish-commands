"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ohnos = void 0;
var utils_1 = require("./utils");
exports.Ohnos = {
    enabled: true,
    ohnos: new Array(),
    makeOhno: function (team, x, y) {
        var ohno = UnitTypes.atrax.spawn(team, x, y);
        ohno.type = UnitTypes.alpha;
        ohno.apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
        ohno.resetController(); //does this work?
        this.ohnos.push(ohno);
        return ohno;
    },
    canSpawn: function (player) {
        if (!this.enabled)
            return "Ohnos have been temporarily disabled.";
        if (this.ohnos.length >= (Groups.player.size() + 1))
            return "Sorry, the max number of ohno units has been reached.";
        if ((0, utils_1.nearbyEnemyTile)(player.unit(), 6) != null)
            return "Too close to an enemy tile!";
        return true;
    },
    killAll: function () {
        this.ohnos.forEach(function (ohno) { var _a; return (_a = ohno === null || ohno === void 0 ? void 0 : ohno.kill) === null || _a === void 0 ? void 0 : _a.call(ohno); });
        this.ohnos = [];
    },
    amount: function () {
        return this.ohnos.length;
    }
};
