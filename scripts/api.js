"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFishPlayer = exports.getCreateFishPlayer = exports.getStopped = exports.free = exports.addStopped = void 0;
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
;
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
;
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
;
// Get the saved fishPlayer from the api, which will save the player if it doesn't exist
function getCreateFishPlayer(fishPlayer, callback) {
    // omit the mindustry player object from the api call
    var player = fishPlayer.player, rest = __rest(fishPlayer, ["player"]);
    var req = Http.post("http://".concat(config_1.ip, ":5000/api/getCreateFishPlayer"), JSON.stringify(__assign({}, rest)))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    try {
        req.submit(function (response, exception) {
            if (exception || !response) {
                var temp = response === null || response === void 0 ? void 0 : response.getResultAsString();
                if (!temp.length)
                    return false;
                var parsedReponseError = JSON.parse(response).error;
                Log.info("\n\n".concat(parsedReponseError !== null && parsedReponseError !== void 0 ? parsedReponseError : 'Stopped API encountered an error while trying to fetch a player.', "\n\n"));
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
        Log.info('\n\nStopped API encountered an error while trying to fetch a player.\n\n');
    }
}
exports.getCreateFishPlayer = getCreateFishPlayer;
;
// Update fishPlayer data on the api
function updateFishPlayer(fishPlayer, callback) {
    // omit the mindustry player object from the api call
    var player = fishPlayer.player, rest = __rest(fishPlayer, ["player"]);
    var req = Http.post("http://".concat(config_1.ip, ":5000/api/updateFishPlayer"), JSON.stringify(__assign({}, rest)))
        .header('Content-Type', 'application/json')
        .header('Accept', '*/*');
    req.timeout = 10000;
    try {
        req.submit(function (response, exception) {
            // Log.info(response.getResultAsString());
            if (exception || !response) {
                var temp = response === null || response === void 0 ? void 0 : response.getResultAsString();
                if (!temp.length)
                    return false;
                var parsedReponseError = JSON.parse(response).error;
                Log.info("\n\n".concat(parsedReponseError !== null && parsedReponseError !== void 0 ? parsedReponseError : 'Stopped API encountered an error while trying to update a player.', "\n\n"));
            }
            else {
                var temp = response.getResultAsString();
                if (!temp.length)
                    return false;
                callback(JSON.parse(temp).status);
            }
        });
    }
    catch (e) {
        Log.info('\n\nStopped API encountered an error while trying to fetch a player.\n\n');
    }
}
exports.updateFishPlayer = updateFishPlayer;
;
