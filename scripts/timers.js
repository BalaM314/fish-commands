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
            Call.sendMessage('[#4fff8f9f]Game saved.');
        });
    }, 10, 300);
    //Trails
    Timer.schedule(function () { return players_1.FishPlayer.forEachPlayer(function (p) {
        if (p.trail)
            Call.effect(Fx[p.trail.type], p.player.x, p.player.y, 0, p.trail.color);
    }); }, 5, 0.15);
}
exports.initializeTimers = initializeTimers;
