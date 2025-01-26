"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the menu system.
*/
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listeners = void 0;
exports.registerListeners = registerListeners;
exports.menu = menu;
var commands_1 = require("./commands");
var players_1 = require("./players");
var utils_1 = require("./utils");
var funcs_1 = require("./funcs");
var funcs_2 = require("./funcs");
/** Stores a mapping from name to the numeric id of a listener that has been registered. */
var registeredListeners = {};
exports.listeners = registeredListeners;
/** Stores all listeners in use by fish-commands. */
var listeners = (function (d) { return d; })({
    generic: function (player, option) {
        var _a, _b;
        var fishSender = players_1.FishPlayer.get(player);
        if (option === -1 || option === fishSender.activeMenu.cancelOptionId)
            return;
        var prevCallback = fishSender.activeMenu.callback;
        (_b = (_a = fishSender.activeMenu).callback) === null || _b === void 0 ? void 0 : _b.call(_a, fishSender, option);
        //if the callback wasn't modified, then clear it
        if (fishSender.activeMenu.callback === prevCallback)
            fishSender.activeMenu.callback = undefined;
        //otherwise, the menu spawned another menu that needs to be handled
    },
    none: function (player, option) {
        //do nothing
    }
});
/** Registers all listeners, should be called on server load. */
function registerListeners() {
    var e_1, _a;
    var _b;
    try {
        for (var _c = __values(Object.entries(listeners)), _d = _c.next(); !_d.done; _d = _c.next()) {
            var _e = __read(_d.value, 2), key = _e[0], listener = _e[1];
            (_b = registeredListeners[key]) !== null && _b !== void 0 ? _b : (registeredListeners[key] = Menus.registerMenu(listener));
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
//this is a minor abomination but theres no good way to do overloads in typescript
function menu(title, description, options, target, callback, includeCancel, optionStringifier, //this is dubious
columns) {
    if (includeCancel === void 0) { includeCancel = true; }
    if (optionStringifier === void 0) { optionStringifier = function (t) { return t; }; }
    if (columns === void 0) { columns = 3; }
    if (!callback) {
        //overload 1, just display a menu with no callback
        Call.menu(target.con, registeredListeners.none, title, description, options.length == 0 ? [] : (0, funcs_2.to2DArray)(options.map(optionStringifier), columns));
    }
    else {
        //overload 2, display a menu with callback
        //Set up the 2D array of options, and maybe add cancel
        //Call.menu() with [[]] will cause a client crash, make sure to pass [] instead
        var arrangedOptions = (options.length == 0 && !includeCancel) ? [] : (0, funcs_2.to2DArray)(options.map(optionStringifier), columns);
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
            try {
                callback(options[option]);
            }
            catch (err) {
                if (err instanceof commands_1.CommandError) {
                    //If the error is a command error, then just outputFail
                    (0, utils_1.outputFail)(err.data, target);
                }
                else {
                    target.sendMessage("[scarlet]\u274C An error occurred while executing the command!");
                    if (target.hasPerm("seeErrorMessages"))
                        target.sendMessage((0, funcs_1.parseError)(err));
                    Log.err("Unhandled error in menu callback: ".concat(target.cleanedName, " submitted menu \"").concat(title, "\" \"").concat(description, "\""));
                    Log.err(err);
                }
            }
        };
        Call.menu(target.con, registeredListeners.generic, title, description, arrangedOptions);
    }
}
