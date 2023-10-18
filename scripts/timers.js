"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTimers = void 0;
var players_1 = require("./players");
var api_1 = require("./api");
var config = require("./config");
var utils_1 = require("./utils");
function initializeTimers() {
    //Autosave
    Timer.schedule(function () {
        var file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
        Core.app.post(function () {
            SaveIO.save(file);
            players_1.FishPlayer.saveAll();
            Call.sendMessage('[#4fff8f9f]Game saved.');
        });
    }, 10, 300);
    //Memory corruption prank
    if (config.Mode.pvp())
        Timer.schedule(function () {
            if (Math.random() < 0.2) {
                //Timer triggers every 8 hours, and the random chance is 20%, so the average interval between pranks is 40 hours
                (0, utils_1.definitelyRealMemoryCorruption)();
            }
        }, 3600, 28800);
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
        }, 5, 3);
    //Tip
    Timer.schedule(function () {
        var showAd = Math.random() < 0.10; //10% chance every 15 minutes
        var messagePool = showAd ? config.tips.ads : config.tips.normal;
        var messageText = messagePool[Math.floor(Math.random() * messagePool.length)];
        var message = showAd ? "[gold]".concat(messageText, "[]") : "[gold]Tip: ".concat(messageText, "[]");
        Call.sendMessage(message);
    }, 0, 15 * 60);
    //State check
    Timer.schedule(function () {
        if (Groups.unit.size() > 10000) {
            Call.sendMessage("\n[scarlet]!!!!!\n[scarlet]Way too many units! Game over!\n[scarlet]!!!!!\n");
            Groups.unit.clear();
            (0, utils_1.neutralGameover)();
        }
    }, 0, 1);
}
exports.initializeTimers = initializeTimers;
