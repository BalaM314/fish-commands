"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTimers = void 0;
var players_1 = require("./players");
var api_1 = require("./api");
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
    //Trails
    Timer.schedule(function () { return players_1.FishPlayer.forEachPlayer(function (p) { return p.displayTrail(); }); }, 5, 0.15);
    //Staff chat
    Timer.schedule(function () {
        (0, api_1.getStaffMessages)(function (messages) {
            if (!messages.length)
                return;
            players_1.FishPlayer.messageStaff(messages);
        });
    }, 5, 3);
}
exports.initializeTimers = initializeTimers;
