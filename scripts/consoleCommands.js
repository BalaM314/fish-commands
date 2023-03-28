"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
var players_1 = require("./players");
var ranks_1 = require("./ranks");
exports.commands = {
    setrank: {
        args: ["player:exactPlayer", "rank:string"],
        description: "Set a player's rank.",
        handler: function (_a) {
            var args = _a.args, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess;
            var rank = ranks_1.Rank.getByName(args.rank);
            if (rank == null) {
                outputFail("Unknown rank ".concat(args.rank));
                return;
            }
            args.player.setRank(rank);
            outputSuccess("Set rank of player \"".concat(args.player.name, "\" to ").concat(rank.name));
        }
    },
    savePlayers: {
        args: [],
        description: "Runs FishPlayer.save()",
        handler: function () {
            players_1.FishPlayer.saveAll();
        }
    }
};
