"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBanned = exports.unban = exports.ban = exports.sendStaffMessage = exports.getStaffMessages = exports.sendModerationMessage = exports.isVpn = exports.getStopped = exports.free = exports.addStopped = void 0;
var config_1 = require("./config");
var players_1 = require("./players");
/** Mark a player as stopped until time */
function addStopped(uuid, time) {
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(config_1.ip, "/api/addStopped"), JSON.stringify({ id: uuid, time: time }))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    req.error(function () { return Log.err("[API] Network error when trying to call api.addStopped()"); });
    req.submit(function (response) {
        //Log.info(response.getResultAsString());
    });
}
exports.addStopped = addStopped;
/** Mark a player as freed */
function free(uuid) {
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(config_1.ip, "/api/free"), JSON.stringify({ id: uuid }))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    req.error(function () { return Log.err("[API] Network error when trying to call api.free()"); });
    req.submit(function (response) {
        //Log.info(response.getResultAsString());
    });
}
exports.free = free;
function getStopped(uuid, callback, callbackError) {
    function fail(err) {
        Log.err("[API] Network error when trying to call api.getStopped()");
        if (err)
            Log.err(err);
        if (callbackError)
            callbackError(err);
        else
            callback(null);
    }
    if (config_1.localDebug)
        return fail("local debug mode");
    var req = Http.post("http://".concat(config_1.ip, "/api/getStopped"), JSON.stringify({ id: uuid }))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    req.error(fail);
    req.submit(function (response) {
        var temp = response.getResultAsString();
        if (!temp.length)
            return fail("reponse empty");
        var time = JSON.parse(temp).time;
        if (isNaN(Number(time)))
            return fail("API IS BROKEN!!! Invalid unmark time \"".concat(time, "\": not a number"));
        if (time.toString().length > 13)
            callback(config_1.maxTime);
        callback(Number(time));
    });
}
exports.getStopped = getStopped;
var cachedIps = {};
/**Make an API request to see if an IP is likely VPN. */
function isVpn(ip, callback, callbackError) {
    if (ip in cachedIps)
        return callback(cachedIps[ip]);
    Http.get("http://ip-api.com/json/".concat(ip, "?fields=proxy,hosting"), function (res) {
        var data = res.getResultAsString();
        var json = JSON.parse(data);
        var isVpn = json.proxy || json.hosting;
        cachedIps[ip] = isVpn;
        players_1.FishPlayer.stats.numIpsChecked++;
        if (isVpn)
            players_1.FishPlayer.stats.numIpsFlagged++;
        callback(isVpn);
    }, callbackError !== null && callbackError !== void 0 ? callbackError : (function (err) {
        Log.err("[API] Network error when trying to call api.isVpn()");
        players_1.FishPlayer.stats.numIpsErrored++;
        callback(false);
    }));
}
exports.isVpn = isVpn;
/**Send text to the moderation logs channel in Discord. */
function sendModerationMessage(message) {
    if (config_1.localDebug) {
        Log.info("Sent moderation log message: ".concat(message));
        return;
    }
    var req = Http.post("http://".concat(config_1.ip, "/api/mod-dump"), JSON.stringify({ message: message })).header('Content-Type', 'application/json').header('Accept', '*/*');
    req.timeout = 10000;
    req.error(function () { return Log.err("[API] Network error when trying to call api.sendModerationMessage()"); });
    req.submit(function (response) {
        //Log.info(response.getResultAsString());
    });
}
exports.sendModerationMessage = sendModerationMessage;
/**Get staff messages from discord. */
function getStaffMessages(callback) {
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(config_1.ip, "/api/getStaffMessages"), JSON.stringify({ server: config_1.Mode.name() }))
        .header('Content-Type', 'application/json').header('Accept', '*/*');
    req.timeout = 10000;
    req.error(function () { return Log.err("[API] Network error when trying to call api.getStaffMessages()"); });
    req.submit(function (response) {
        var temp = response.getResultAsString();
        if (!temp.length)
            Log.err("[API] Network error(empty response) when trying to call api.getStaffMessages()");
        else
            callback(JSON.parse(temp).messages);
    });
}
exports.getStaffMessages = getStaffMessages;
/**Send staff messages from server. */
function sendStaffMessage(message, playerName, callback) {
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(config_1.ip, "/api/sendStaffMessage"), 
    // need to send both name variants so one can be sent to the other servers with color and discord can use the clean one
    JSON.stringify({ message: message, playerName: playerName, cleanedName: Strings.stripColors(playerName), server: config_1.Mode.name() })).header('Content-Type', 'application/json').header('Accept', '*/*');
    req.timeout = 10000;
    req.error(function () {
        Log.err("[API] Network error when trying to call api.sendStaffMessage()");
        callback === null || callback === void 0 ? void 0 : callback(false);
    });
    req.submit(function (response) {
        var temp = response.getResultAsString();
        if (!temp.length)
            Log.err("[API] Network error(empty response) when trying to call api.sendStaffMessage()");
        else
            callback === null || callback === void 0 ? void 0 : callback(JSON.parse(temp).data);
    });
}
exports.sendStaffMessage = sendStaffMessage;
/** Bans the provided ip and/or uuid. */
function ban(data, callback) {
    if (callback === void 0) { callback = function () { }; }
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(config_1.ip, "/api/ban"), JSON.stringify(data))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    req.error(function () { return Log.err("[API] Network error when trying to call api.ban(".concat(data.ip, ", ").concat(data.uuid, ")")); });
    req.submit(function (response) {
        var str = response.getResultAsString();
        if (!str.length)
            return Log.err("[API] Network error(empty response) when trying to call api.ban()");
        callback(JSON.parse(str).data);
    });
}
exports.ban = ban;
/** Unbans the provided ip and/or uuid. */
function unban(data, callback) {
    if (callback === void 0) { callback = function () { }; }
    if (config_1.localDebug)
        return;
    var req = Http.post("http://".concat(config_1.ip, "/api/unban"), JSON.stringify(data))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    req.error(function () { return Log.err("[API] Network error when trying to call api.ban({".concat(data.ip, ", ").concat(data.uuid, "})")); });
    req.submit(function (response) {
        var str = response.getResultAsString();
        if (!str.length)
            return Log.err("[API] Network error(empty response) when trying to call api.unban()");
        var parsedData = JSON.parse(str);
        callback(parsedData.status, parsedData.error);
    });
}
exports.unban = unban;
/** Gets if either the provided uuid or ip is banned. */
function getBanned(data, callback) {
    if (config_1.localDebug) {
        Log.info("[API] Attempted to getBanned(".concat(data.uuid, "/").concat(data.ip, "), assuming false due to local debug"));
        callback(false);
        return;
    }
    //TODO cache 4s
    var req = Http.post("http://".concat(config_1.ip, "/api/checkIsBanned"), JSON.stringify(data))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    req.error(function () { return Log.err("[API] Network error when trying to call api.getBanned()"); });
    req.submit(function (response) {
        var str = response.getResultAsString();
        if (!str.length)
            return Log.err("[API] Network error(empty response) when trying to call api.getBanned()");
        callback(JSON.parse(str).data);
    });
}
exports.getBanned = getBanned;
