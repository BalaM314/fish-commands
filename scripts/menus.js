"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.menu = exports.listeners = void 0;
var players_1 = require("./players");
var utils_1 = require("./utils");
var registeredListeners = {};
exports.listeners = registeredListeners;
var listeners = (function (d) { return d; })({
    generic: function (player, option) {
        var _a, _b;
        var fishSender = players_1.FishPlayer.get(player);
        if (option === -1 || option === fishSender.activeMenu.cancelOptionId)
            return;
        (_b = (_a = fishSender.activeMenu).callback) === null || _b === void 0 ? void 0 : _b.call(_a, fishSender, option);
        fishSender.activeMenu.callback = undefined;
    },
    none: function (player, option) {
        //do nothing
    }
});
Events.on(ServerLoadEvent, function (e) {
    var e_1, _a;
    var _b;
    try {
        for (var _c = __values(Object.keys(listeners)), _d = _c.next(); !_d.done; _d = _c.next()) {
            var key = _d.value;
            (_b = registeredListeners[key]) !== null && _b !== void 0 ? _b : (registeredListeners[key] = Menus.registerMenu(listeners[key]));
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
//this is a minor abomination but theres no good way to do overloads in typescript
function menu(title, description, options, target, callback, includeCancel, optionStringifier //this is dubious
) {
    if (includeCancel === void 0) { includeCancel = true; }
    if (optionStringifier === void 0) { optionStringifier = function (t) { return t; }; }
    if (!callback) {
        //overload 1, just display a menu with no callback
        Call.menu(target.player.con, registeredListeners.none, title, description, options);
    }
    else {
        //overload 2, display a menu with callback
        //Set up the 2D array of options, and add cancel
        var arrangedOptions = (0, utils_1.to2DArray)(options.map(optionStringifier), 3);
        if (includeCancel) {
            arrangedOptions.push(["Cancel"]);
            target.activeMenu.cancelOptionId = options.length;
        }
        else {
            target.activeMenu.cancelOptionId = -1;
        }
        //The target fishPlayer has a property called activeMenu, which stores information about the last menu triggered.
        target.activeMenu.callback = function (fishSender, option) {
            //Additional permission validation could be done here, but the only way that callback() can be called is if the above statement executed,
            //and on sensitive menus such as the stop menu, the only way to reach that is if menu() was called by the /stop command,
            //which already checks permissions.
            //Additionally, the callback is cleared by the generic menu listener after it is executed.
            //We do need to validate option though, as it can be any number.
            if (!(option in options))
                return;
            callback({
                option: options[option],
                sender: target,
                outputFail: function (message) {
                    target.player.sendMessage("[scarlet]\u26A0 [yellow]".concat(message));
                },
                outputSuccess: function (message) {
                    target.player.sendMessage("[#48e076]".concat(message));
                }
            });
        };
        Call.menu(target.player.con, registeredListeners.generic, title, description, arrangedOptions);
    }
}
exports.menu = menu;
