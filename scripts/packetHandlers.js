"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = exports.loadPacketHandlers = void 0;
var commands_1 = require("./commands");
var players_1 = require("./players");
var ranks_1 = require("./ranks");
var lastLabelText = "";
var lastAccessedBulkLabel;
var lastAccessedLabel;
var lastAccessedBulkLine;
var lastAccessedLine;
var loadPacketHandlers = function () {
    Vars.netServer.addPacketHandler("label", function (player, content) {
        try {
            if (players_1.FishPlayer.get(player).stopped)
                return;
            var parts = content.split(',');
            if (parts.length != 4) {
                player.kick("\nAn error has occured while trying to process your label request:\nYou've put more/less than 4 parts into the content, it needs to be text,duration,x,y\nexample [\"E\",10,Vars.player.x,Vars.player.y].join(\",\")\nif duration is bigger than 10 it will default to 3\nif texts length is above 41 it will kick you\n", 0);
                return;
            }
            if (parts[0].length > 41) {
                player.kick("ok that's a lot of characters, 41 is the limit here", 0);
                return;
            }
            if (Number(parts[1]) <= 10) {
                Call.label(parts[0], Number(parts[1]), Number(parts[2]), Number(parts[3]));
            }
            else {
                Call.label(parts[0], 3, Number(parts[2]), Number(parts[3]));
            }
            lastAccessedLabel = player;
            lastLabelText = parts[0];
        }
        catch (e) {
            player.kick("An error has occured while trying to process your label request, \n" + e, 0);
        }
    });
    Vars.netServer.addPacketHandler("bulkLabel", function (player, content) {
        if (!player.admin && !(players_1.FishPlayer.get(player).rank == ranks_1.Rank.mod)) {
            player.kick("Not an admin or a moderator, cannot access BulkLabel", 0);
            return;
        }
        try {
            var parts = content.split('|');
            if (parts.length > 1000) {
                player.kick("Hey man that's a... i get you're an admin or a moderator but... that's too much labels", 0);
                return;
            }
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                var parts_of_part = part.split(",");
                Call.labelReliable(parts_of_part[0], Number(parts_of_part[1]), Number(parts_of_part[2]), Number(parts_of_part[3]));
            }
            lastAccessedBulkLabel = player;
        }
        catch (e) {
            player.kick("An error has occured while trying to process your label request, \n" + e, 0);
        }
    });
    Vars.netServer.addPacketHandler("lineEffect", function (player, content) {
        if (players_1.FishPlayer.get(player).stopped)
            return;
        try {
            var parts = content.split(',');
            if (parts.length != 5) {
                player.kick("\nAn error has occured while trying to process your lineEffect request: invalid format: format is origin_x,origin_y,end_x,end_y,color\nexample: [5,5,100,100,Color.green].join(\",\")", 0);
                return;
            }
            Call.effect(Fx.pointBeam, Number(parts[0]), Number(parts[1]), 0, Color.valueOf(parts[4]), new Vec2(Number(parts[2]), Number(parts[3])));
            lastAccessedLine = player;
        }
        catch (e) {
            player.kick("An error has occured while trying to process your lineEffect request, \n" + e, 0);
        }
    }); // this is the silas effect
    Vars.netServer.addPacketHandler("bulkLineEffect", function (player, content) {
        if (players_1.FishPlayer.get(player).stopped)
            return;
        try {
            var parts = content.split('|');
            if (!player.admin && !(players_1.FishPlayer.get(player).rank == ranks_1.Rank.mod) && parts.length > 10) {
                player.kick("Non admins can only have a bulk line of 10 parts", 0);
                return;
            }
            if (parts.length >= 1000) {
                player.kick("Hey man that's a... i get you're an admin but... that's too much effects", 0);
                return;
            }
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                var parts_of_part = part.split(",");
                Call.effect(Fx.pointBeam, Number(parts_of_part[0]), Number(parts_of_part[1]), 0, Color.valueOf(parts_of_part[4]), new Vec2(Number(parts_of_part[2]), Number(parts_of_part[3])));
            }
            ;
            lastAccessedBulkLine = player;
        }
        catch (e) {
            player.kick("An error has occured while trying to process your bulkLineEffect request, \n" + e, 0);
        }
    });
    // this is the silas effect but it gets real
    // too real perhap?
};
exports.loadPacketHandlers = loadPacketHandlers;
exports.commands = {
    packet_handler_last_accessed: {
        args: [],
        description: 'Gives you the players and the packet handler which they last accessed',
        perm: commands_1.Perm.notGriefer,
        handler: function (_a) {
            var output = _a.output, outputFail = _a.outputFail;
            try {
                var outputText = [""];
                if (lastAccessedLabel != undefined && lastLabelText != undefined)
                    outputText.push("label: " + lastAccessedLabel.name + " last text performed with it: " + lastLabelText);
                if (lastAccessedBulkLine != undefined)
                    outputText.push("bulkLine: " + lastAccessedBulkLine.name);
                if (lastAccessedLine != undefined)
                    outputText.push("line: " + lastAccessedLine.name);
                if (lastAccessedBulkLabel != undefined)
                    outputText.push("line: " + lastAccessedBulkLabel.name);
                output(outputText.join("\n") + "\nIf this command didn't return any names that means nobody accessed any of the packet handlers)");
            }
            catch (e) {
                outputFail("[red]There was an error executing this command, i'm not sure how that can happen but yeah..\n" + e);
            }
        }
    },
    packet_handler_docs: {
        description: 'Documentation on how to use packet handlers that are in this server',
        args: [],
        perm: commands_1.Perm.notGriefer,
        handler: function (_a) {
            var sender = _a.sender;
            var p = sender.player;
            Call.infoMessage(p.con, "also keep in mind that T H E R E  I S   A   P A C K E T   S P A M   L I M I T");
            Call.infoMessage(p.con, "[green]Also keep in mind that you have to multiply by 8 to spawn it at a clear coordinate (For example instead of 5,5 you'd have to do 5*8,5*8 to spawn a thing at 5,5, does this sound confusing...)");
            Call.infoMessage(p.con, "these packet handlers and everything related to them are made by [green]frog");
            Call.infoMessage(p.con, "\"worst error handling i have ever seen, why kick the player???\"\n  -ASimpleBeginner");
            Call.infoMessage(p.con, "All commands mentioned should be performed on the client side console");
            if (p.admin) {
                Call.infoMessage(p.con, "bulkLabel - Call.serverPacketReliable(\"bulkLabel\",/*it's basically like label but seperated by | you get the idea*/) - this is admin only");
            }
            Call.infoMessage(p.con, "label - Call.serverPacketReliable(\"label\",[text,duration,x,y].join(\",\"))\nthe text cannot be larger than 41 characters, duration cannot be larger than 10");
            Call.infoMessage(p.con, "lineEffect - Call.serverPacketReliable(\"lineEffect\",[startX,startY,endX,endY,color].join(\",\"))\n The color is a hex code and a string");
            Call.infoMessage(p.con, "bulkLineEffect - Call.serverPacketReliable(\"bulkLineEffect\",[startX,startY,endX,endY,color].join(\",\")+\"|\"+[startX,startY,endX,endY,color].join(\",\")+\"|\"))) - lineEffect but seperated by | so packet spam won't be a problem, can only contain 10 effects");
        }
    }
};
