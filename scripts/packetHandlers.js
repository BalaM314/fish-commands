"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = exports.loadPacketHandlers = void 0;
var commands_1 = require("./commands");
var players_1 = require("./players");
//info tracker
var lastLabel = '';
var lastAccessedBulkLabel = null;
var lastAccessedLabel = null;
var lastAccessedBulkLine = null;
var lastAccessedLine = null;
var bulkLimit = 4096;
var noPermissionText = '[red]You don\'t have permission to use this packet.';
var invalidContentText = '[red]Invalid label content.';
var bulkSeparator = '|';
var procError = '[red]An error occured while processing your request.';
var invalidReq = '[red]Invalid request. Please consult the documentation.';
var tmpLinePacket = new EffectCallPacket2();
var tmpLabelPacket = new LabelReliableCallPacket();
function loadPacketHandlers() {
    //initialize line packet
    tmpLinePacket.effect = Fx.pointBeam;
    tmpLinePacket.rotation = 0.0;
    tmpLinePacket.color = Tmp.c1;
    tmpLinePacket.data = Tmp.v1;
    //labels
    //fmt: "content,duration,x,y"
    Vars.netServer.addPacketHandler('label', function (player, content) {
        try {
            var p = players_1.FishPlayer.get(player);
            if (!p.hasPerm('play')) {
                player.sendMessage(noPermissionText);
                return;
            }
            lastAccessedLabel = p;
            handleLabel(player, content, true);
        }
        catch (e) {
            //TEMP FOR DEBUGGING: REMOVE L8R
            //Log.err(e as Error);
            player.sendMessage(procError);
        }
    });
    Vars.netServer.addPacketHandler('bulkLabel', function (player, content) {
        try {
            var p = players_1.FishPlayer.get(player);
            if (!p.hasPerm('play') || !p.hasPerm('bulkLabelPacket')) {
                player.sendMessage(noPermissionText);
                return;
            }
            lastAccessedBulkLabel = p;
            //get individual labels
            var labels = [];
            var inQuotes = false;
            var startIdx = 0;
            for (var i = 0; i < content.length; i++) {
                switch (content[i]) {
                    case '"':
                        if (i > 0 && content[i - 1] == '\\')
                            break;
                        inQuotes = !inQuotes;
                        break;
                    //separate
                    case bulkSeparator:
                        if (inQuotes)
                            break;
                        labels.push(content.substring(startIdx, i));
                        startIdx = i + 1;
                        break;
                    default:
                        break;
                }
            }
            //last label
            if (startIdx < content.length) {
                labels.push(content.substring(startIdx, content.length - 1));
            }
            //display labels
            for (var i = 0; i < labels.length; i++) {
                var label = labels[i];
                if (label.trim().length <= 0)
                    continue;
                if (!handleLabel(player, label, false))
                    return;
            }
        }
        catch (e) {
            //TEMP FOR DEBUGGING: REMOVE L8R
            //Log.err(e as Error);
            player.sendMessage(procError);
        }
    });
    //lines
    Vars.netServer.addPacketHandler('lineEffect', function (player, content) {
        try {
            var p = players_1.FishPlayer.get(player);
            if (!p.hasPerm('play')) {
                player.sendMessage(noPermissionText);
                return;
            }
            if (!handleLine(content, player))
                return;
            lastAccessedLine = p;
        }
        catch (e) {
            //TEMP FOR DEBUGGING: REMOVE L8R
            //Log.err(e as Error);
            player.sendMessage(procError);
        }
    });
    //this is the silas effect but it's way too real
    Vars.netServer.addPacketHandler('bulkLineEffect', function (player, content) {
        try {
            var p = players_1.FishPlayer.get(player);
            if (!p.hasPerm('play') || !p.hasPerm('bulkLabelPacket')) {
                player.sendMessage(noPermissionText);
                return;
            }
            var lines = content.split(bulkSeparator);
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.trim().length <= 0)
                    continue;
                if (!handleLine(line, player))
                    return;
            }
            lastAccessedBulkLine = p;
        }
        catch (e) {
            //TEMP FOR DEBUGGING: REMOVE L8R
            //Log.err(e as Error);
            player.sendMessage(procError);
        }
    });
}
exports.loadPacketHandlers = loadPacketHandlers;
//commands
exports.commands = (0, commands_1.commandList)({
    pklast: {
        args: [],
        description: 'Tells you who last accessed the packet handlers.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var output = _a.output;
            var outputLines = [];
            if (lastAccessedLabel && lastLabel) {
                outputLines.push("".concat(lastAccessedLabel.name, " created label \"").concat(lastLabel, "\"."));
            }
            if (lastAccessedBulkLabel) {
                outputLines.push("".concat(lastAccessedBulkLabel.name, " last used the bulk label effect."));
            }
            if (lastAccessedLine) {
                outputLines.push("".concat(lastAccessedLine.name, " last used the line effect."));
            }
            if (lastAccessedBulkLine) {
                outputLines.push("".concat(lastAccessedBulkLine.name, " last used the bulk line effect."));
            }
            output(outputLines.length > 0 ? outputLines.join('\n') : 'No packet handlers have been accessed yet.');
        }
    },
    pkdocs: {
        description: 'Packet handler documentation.',
        args: [],
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var sender = _a.sender, output = _a.output;
            var responseLines = [];
            var canBulk = sender.hasPerm('bulkLabelPacket');
            responseLines.push('Line effect: "lineEffect", "x0,y0,x1,y1,hexColor" (for example "20.7,19.3,50.4,28.9,#FF0000")\n');
            if (canBulk)
                responseLines.push('Bulk line effect: "bulkLineEffect", equivalent to multiple lineEffect packets, with every line separated by a \'|\' symbol.\n');
            responseLines.push('Label effect: "label", "content,duration,x,y" (for example ""Hi!",10,20,28")\n');
            if (canBulk)
                responseLines.push('Bulk label effect: "bulkLabel", equivalent to multiple label packets, with every label separated by a \'|\' symbol.\n');
            responseLines.push('Use "Call.serverPacketReliable" to send these.');
            responseLines.push('You need to multiply world coordinates by Vars.tilesize (8) for things to work properly. This is a relic from the v3 days where every tile was 8 pixels.');
            responseLines.push('Keep in mind there\'s a packet spam limit. Use at your own risk.');
            responseLines.push(''); //empty line
            //credit
            responseLines.push('These packet handlers and everything related to them were made by [green]frog[white].');
            responseLines.push('"The code style when submitted was beyond drunk... but it worked... barely"\n    -BalaM314');
            responseLines.push('"worst error handling i have ever seen, why kick the player???"\n    -ASimpleBeginner');
            responseLines.push('Most of the code was rewritten in 2024 by [#6e00fb]D[#9e15de]a[#cd29c2]r[#fd3ea5]t[white].');
            //bulkInfoMsg(responseLines, sender.player.con as NetConnection);
            output(responseLines.join('\n'));
        }
    }
});
//#region utils
function findEndQuote(content, startPos) {
    if (content[startPos] != '"') {
        //not a start quote??
        return -1;
    }
    for (var i = startPos + 1; i < content.length; i++) {
        if (content[i] == '"' && (i < 1 || content[i - 1] != '\\')) {
            return i;
        }
    }
    return -1;
}
function handleLabel(player, content, isSingle) {
    var endPos = findEndQuote(content, 0);
    if (endPos == -1) {
        //invalid content
        player.sendMessage(invalidContentText);
        return false;
    }
    //label, clean up \"s
    var message = content.substring(1, endPos).replace('\\"', '"');
    var parts = content.substring(endPos + 2).split(',');
    if (parts.length != 3) { //dur,x,y
        player.sendMessage(invalidReq);
        return false;
    }
    if (isSingle) {
        lastLabel = message;
    }
    /*Call.labelReliable(
        message,          //message
        Number(parts[0]), //duration
        Number(parts[1]), //x
        Number(parts[2])  //y
    );*/
    tmpLabelPacket.message = message;
    tmpLabelPacket.duration = Number(parts[0]);
    tmpLabelPacket.worldx = Number(parts[1]);
    tmpLabelPacket.worldy = Number(parts[2]);
    Vars.net.send(tmpLabelPacket, true); //maybe do false
    return true;
}
function handleLine(content, player) {
    var parts = content.split(',');
    if (parts.length != 5) { //x0,y0,x1,y1,color
        player.sendMessage(invalidReq);
        return false;
    }
    Tmp.v1.set(Number(parts[2]), Number(parts[3])); //x1,y1
    Color.valueOf(Tmp.c1, parts[4]); //color
    /*Call.effect(
        Fx.pointBeam,
        Number(parts[0]), Number(parts[1]), //x,y
        0, Tmp.c1,                          //color
        Tmp.v1                              //x1,y1
    );*/
    tmpLinePacket.x = Number(parts[0]);
    tmpLinePacket.y = Number(parts[1]);
    Vars.net.send(tmpLinePacket, false); //could do true for reliable but prob too laggy (?)
    return true;
}
function bulkInfoMsg(messages, conn) {
    for (var i = messages.length - 1; i >= 0; i--) {
        Call.infoMessage(conn, messages[i]);
    }
}
//#endregion
