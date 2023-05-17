"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendStaffMessage = exports.getStaffMessages = exports.sendModerationMessage = exports.isVpn = exports.getStopped = exports.free = exports.addStopped = void 0;
var config_1 = require("./config");
// Add a player's uuid to the stopped api
function addStopped(uuid) {
    var req = Http.post("http://".concat(config_1.ip, ":5000/api/addStopped"), JSON.stringify({ id: uuid }))
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
// Remove a player's uuid from the stopped api
function free(uuid) {
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
// Check if player is stopped from API
function getStopped(uuid, callback) {
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
                callback(JSON.parse(temp).data);
            }
        });
    }
    catch (e) {
        Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
    }
}
exports.getStopped = getStopped;
/**Make an API request to see if an IP is likely VPN. */
function isVpn(ip, callback, callbackError) {
    try {
        Http.get("http://ip-api.com/json/".concat(ip, "?fields=proxy,hosting"), function (res) {
            var data = res.getResultAsString();
            var json = JSON.parse(data);
            callback(json.proxy || json.hosting);
        });
    }
    catch (err) {
        callbackError === null || callbackError === void 0 ? void 0 : callbackError(err);
    }
}
exports.isVpn = isVpn;
/**Send text to the moderation logs channel in Discord. */
function sendModerationMessage(message) {
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
