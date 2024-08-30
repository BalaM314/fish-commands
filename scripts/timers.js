"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTimers = void 0;
var api_1 = require("./api");
var config = require("./config");
var config_1 = require("./config");
var files_1 = require("./files");
var globals_1 = require("./globals");
var players_1 = require("./players");
var utils_1 = require("./utils");
function initializeTimers() {
    Timer.schedule(function () {
        var e_1, _a;
        //Autosave
        var file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
        Core.app.post(function () {
            SaveIO.save(file);
            players_1.FishPlayer.saveAll();
            Call.sendMessage('[#4fff8f9f]Game saved.');
        });
        try {
            //Unblacklist trusted players
            for (var _b = __values(Object.values(players_1.FishPlayer.cachedPlayers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var fishP = _c.value;
                if (fishP.ranksAtLeast("trusted")) {
                    Vars.netServer.admins.dosBlacklist.remove(fishP.info().lastIP);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }, 10, 300);
    //Memory corruption prank
    Timer.schedule(function () {
        if (Math.random() < 0.2 && !config_1.Mode.hexed()) {
            //Timer triggers every 17 hours, and the random chance is 20%, so the average interval between pranks is 85 hours
            (0, utils_1.definitelyRealMemoryCorruption)();
        }
    }, 3600, 61200);
    //Trails
    Timer.schedule(function () {
        return players_1.FishPlayer.forEachPlayer(function (p) { return p.displayTrail(); });
    }, 5, 0.15);
    //Staff chat
    if (!config.localDebug)
        Timer.schedule(function () {
            (0, api_1.getStaffMessages)(function (messages) {
                if (messages.length)
                    players_1.FishPlayer.messageStaff(messages);
            });
        }, 5, 2);
    //Tip
    Timer.schedule(function () {
        var showAd = Math.random() < 0.10; //10% chance every 15 minutes
        var messagePool = showAd ? config.tips.ads : config.tips.normal;
        var messageText = messagePool[Math.floor(Math.random() * messagePool.length)];
        var message = showAd ? "[gold]".concat(messageText, "[]") : "[gold]Tip: ".concat(messageText, "[]");
        Call.sendMessage(message);
    }, 60, 15 * 60);
    //State check
    Timer.schedule(function () {
        if (Groups.unit.size() > 10000) {
            Call.sendMessage("\n[scarlet]!!!!!\n[scarlet]Way too many units! Game over!\n[scarlet]!!!!!\n");
            Groups.unit.clear();
            (0, utils_1.neutralGameover)();
        }
    }, 0, 1);
    Timer.schedule(function () {
        players_1.FishPlayer.updateAFKCheck();
    }, 0, 1);
    //Various bad antibot code TODO fix, dont update state on clock tick
    Timer.schedule(function () {
        players_1.FishPlayer.antiBotModePersist = false;
        //dubious code, will keep antibot mode on for the next minute after it was triggered by high flag count or high join count
        if (players_1.FishPlayer.flagCount > 10 || players_1.FishPlayer.playersJoinedRecent > 50)
            players_1.FishPlayer.antiBotModePersist = true;
        players_1.FishPlayer.flagCount = 0;
        globals_1.ipJoins.clear();
    }, 0, 60);
    Timer.schedule(function () {
        if (players_1.FishPlayer.playersJoinedRecent > 50)
            players_1.FishPlayer.antiBotModePersist = true;
        players_1.FishPlayer.playersJoinedRecent = 0;
    }, 0, 40);
    Timer.schedule(function () {
        if (players_1.FishPlayer.antiBotMode()) {
            Call.infoToast("[scarlet]ANTIBOT ACTIVE!!![] DOS blacklist size: ".concat(Vars.netServer.admins.dosBlacklist.size), 2);
        }
    }, 0, 1);
    Timer.schedule(function () {
        players_1.FishPlayer.validateVotekickSession();
    }, 0, 0.5);
}
exports.initializeTimers = initializeTimers;
Timer.schedule(function () {
    Call.sendMessage("[orange]Updating maps...");
    (0, files_1.updateMaps)()
        .then(function () {
        Call.sendMessage("[orange]Maps updated.");
        Log.info("Automated map updates complete.");
    })
        .catch(function (message) {
        Call.sendMessage("[orange]Maps update failed.");
        Log.err("Automated map update failed: ".concat(message));
    });
}, 600);
