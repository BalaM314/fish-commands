"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTimers = void 0;
var players_1 = require("./players");
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
}
exports.initializeTimers = initializeTimers;
