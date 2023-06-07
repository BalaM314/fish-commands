"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBanned = exports.ban = exports.sendStaffMessage = exports.getStaffMessages = exports.sendModerationMessage = exports.isVpn = exports.getStopped = exports.free = exports.addStopped = void 0;
var config_1 = require("./config");
var players_1 = require("./players");
/** Mark a player as stopped until time */
function addStopped(uuid, time) {
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(config_1.ip, ":5000/api/addStopped"), JSON.stringify({ id: uuid, time: time }))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    try {
        req.submit(function (response, exception) {
            //Log.info(response.getResultAsString());
            if (exception || !response) {
                Log.info('\n\nStopped API encountered an error while trying to add a stopped player.\n\n');
            }
        });
    }
    catch (e) {
        Log.info('\n\nStopped API encountered an error while trying to add a stopped player.\n\n');
    }
}
exports.addStopped = addStopped;
/** Mark a player as freed */
function free(uuid) {
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(config_1.ip, ":5000/api/free"), JSON.stringify({ id: uuid }))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    try {
        req.submit(function (response, exception) {
            //Log.info(response.getResultAsString());
            if (exception || !response) {
                Log.info('\n\nStopped API encountered an error while trying to free a stopped player.\n\n');
            }
        });
    }
    catch (e) {
        Log.info('\n\nStopped API encountered an error while trying to free a stopped player.\n\n');
    }
}
exports.free = free;
/** Gets player's unmark time */
function getStopped(uuid, callback) {
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(config_1.ip, ":5000/api/getStopped"), JSON.stringify({ id: uuid }))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    try {
        req.submit(function (response, exception) {
            if (exception || !response) {
                Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
            }
            else {
                var temp = response.getResultAsString();
                if (!temp.length)
                    return false;
                var time = JSON.parse(temp).time;
                if (isNaN(Number(time))) {
                    Log.err("API IS BROKEN!!! Invalid unmark time \"".concat(time, "\": not a number"));
                }
                else if (time.toString().length > 13) {
                    callback(config_1.maxTime);
                }
                else {
                    callback(Number(time));
                }
            }
        });
    }
    catch (e) {
        Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
    }
}
exports.getStopped = getStopped;
var cachedIps = {};
/**Make an API request to see if an IP is likely VPN. */
function isVpn(ip, callback, callbackError) {
    if (ip in cachedIps)
        callback(cachedIps[ip]);
    try {
        Http.get("http://ip-api.com/json/".concat(ip, "?fields=proxy,hosting"), function (res) {
            var data = res.getResultAsString();
            var json = JSON.parse(data);
            var isVpn = json.proxy || json.hosting;
            cachedIps[ip] = isVpn;
            players_1.FishPlayer.stats.numIpsChecked++;
            if (isVpn)
                players_1.FishPlayer.stats.numIpsFlagged++;
            callback(isVpn);
        });
    }
    catch (err) {
        callbackError === null || callbackError === void 0 ? void 0 : callbackError(err);
    }
}
exports.isVpn = isVpn;
/**Send text to the moderation logs channel in Discord. */
function sendModerationMessage(message) {
    if (config_1.localDebug) {
        Log.info("Sent moderation log message: ".concat(message));
        return;
    }
    var req = Http.post("http://".concat(config_1.ip, ":5000/api/mod-dump"), JSON.stringify({ message: message })).header('Content-Type', 'application/json').header('Accept', '*/*');
    req.timeout = 10000;
    try {
        req.submit(function (response, exception) {
            if (exception || !response) {
                Log.info('\n\nError occured when trying to log moderation action.\n\n');
            }
        });
    }
    catch (e) {
        Log.info('\n\nError occured when trying to log moderation action.\n\n');
    }
}
exports.sendModerationMessage = sendModerationMessage;
/**Get staff messages from discord. */
function getStaffMessages(callback) {
    if (config_1.localDebug)
        return;
    var server = (0, config_1.getGamemode)();
    var req = Http.post("http://".concat(config_1.ip, ":5000/api/getStaffMessages"), JSON.stringify({ server: server })).header('Content-Type', 'application/json').header('Accept', '*/*');
    req.timeout = 10000;
    try {
        req.submit(function (response, exception) {
            if (exception || !response) {
                Log.info('\n\nError occured when trying to fetch staff chat.\n\n');
            }
            else {
                var temp = response.getResultAsString();
                if (!temp.length)
                    return false;
                callback(JSON.parse(temp).messages);
            }
        });
    }
    catch (e) {
        Log.info('\n\nError occured when trying to fetch staff chat.\n\n');
    }
}
exports.getStaffMessages = getStaffMessages;
/**Send staff messages from server. */
function sendStaffMessage(message, playerName, callback) {
    if (callback === void 0) { callback = function () { }; }
    if (config_1.localDebug)
        return;
    var server = (0, config_1.getGamemode)();
    var req = Http.post("http://".concat(config_1.ip, ":5000/api/sendStaffMessage"), 
    // need to send both name variants so one can be sent to the other servers with color and discord can use the clean one
    JSON.stringify({ message: message, playerName: playerName, cleanedName: Strings.stripColors(playerName), server: server }))
        .header('Content-Type', 'application/json').header('Accept', '*/*');
    req.timeout = 10000;
    try {
        req.submit(function (response, exception) {
            if (exception || !response) {
                Log.info('\n\nError occured when trying to send staff chat.\n\n');
            }
            else {
                var temp = response.getResultAsString();
                if (!temp.length)
                    return false;
                callback(JSON.parse(temp).data);
            }
        });
    }
    catch (e) {
        Log.info('\n\nError occured when trying to send staff chat.\n\n');
    }
}
exports.sendStaffMessage = sendStaffMessage;
function ban(_a, callback) {
    var ip = _a.ip, uuid = _a.uuid;
    if (callback === void 0) { callback = function () { }; }
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(ip, ":5000/api/ban"), JSON.stringify({ ip: ip, uuid: uuid }))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    try {
        req.submit(function (response, exception) {
            //Log.info(response.getResultAsString());
            if (exception || !response) {
                Log.info('\n\nStopped API encountered an error while trying to add a stopped player.\n\n');
            }
            else {
                var str = response.getResultAsString();
                if (str.length)
                    callback(JSON.parse(str).data);
            }
        });
    }
    catch (e) {
        Log.info('\n\nStopped API encountered an error while trying to add a stopped player.\n\n');
    }
}
exports.ban = ban;
/** Gets player's unmark time */
function getBanned(_a, callback) {
    var uuid = _a.uuid, ip = _a.ip;
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(ip, ":5000/api/checkIsBanned"), JSON.stringify({ ip: ip, uuid: uuid }))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    try {
        req.submit(function (response, exception) {
            if (exception || !response) {
                Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
            }
            else {
                var temp = response.getResultAsString();
                if (temp.length)
                    callback(JSON.parse(temp).data);
            }
        });
    }
    catch (e) {
        Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
    }
}
exports.getBanned = getBanned;
