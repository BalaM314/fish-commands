"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the menu system.
*/
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
exports.listeners = exports.Menu = void 0;
exports.registerListeners = registerListeners;
var commands_1 = require("./commands");
var players_1 = require("./players");
var utils_1 = require("./utils");
var funcs_1 = require("./funcs");
var funcs_2 = require("./funcs");
var promise_1 = require("./promise");
/** Stores a mapping from name to the numeric id of a listener that has been registered. */
var registeredListeners = {};
exports.listeners = registeredListeners;
/** Stores all listeners in use by fish-commands. */
var listeners = {
    generic: function (player, option) {
        var _a, _b;
        var fishSender = players_1.FishPlayer.get(player);
        //TODO replace with queue
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
};
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
exports.Menu = {
    /** Displays a menu to a player, returning a Promise. */
    menu: function (title, description, options, target, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.includeCancel, includeCancel = _c === void 0 ? false : _c, _d = _b.optionStringifier, optionStringifier = _d === void 0 ? String : _d, _e = _b.columns, columns = _e === void 0 ? 3 : _e, _f = _b.onCancel, onCancel = _f === void 0 ? "ignore" : _f, _g = _b.cancelOptionId, cancelOptionId = _g === void 0 ? -1 : _g;
        var _h = promise_1.Promise.withResolvers(), promise = _h.promise, reject = _h.reject, resolve = _h.resolve;
        //Set up the 2D array of options, and maybe add cancel
        //Call.menu() with [[]] will cause a client crash, make sure to pass [] instead
        var arrangedOptions = (options.length == 0 && !includeCancel) ? [] : (0, funcs_2.to2DArray)(options.map(optionStringifier), columns);
        if (includeCancel) {
            arrangedOptions.push(["Cancel"]);
            cancelOptionId = options.length;
        }
        //The target fishPlayer has a property called activeMenu, which stores information about the last menu triggered.
        target.activeMenu.callback = function (fishSender, option) {
            //Additional permission validation could be done here, but the only way that callback() can be called is if the above statement executed,
            //and on sensitive menus such as the stop menu, the only way to reach that is if menu() was called by the /stop command,
            //which already checks permissions.
            //Additionally, the callback is cleared by the generic menu listener after it is executed.
            try {
                //We do need to validate option though, as it can be any number.
                if (option === -1 || option === fishSender.activeMenu.cancelOptionId || !(option in options)) {
                    //Consider any invalid option to be a cancellation
                    if (onCancel == "null")
                        resolve(null);
                    else if (onCancel == "reject")
                        reject("cancel");
                    else
                        return;
                }
                else {
                    resolve(options[option]);
                }
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
        return promise;
    },
    /** Rejects with a CommandError if the user chooses to cancel. */
    confirm: function (target, description, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.cancelOutput, cancelOutput = _c === void 0 ? "Cancelled." : _c, _d = _b.title, title = _d === void 0 ? "Confirm" : _d, _e = _b.confirmText, confirmText = _e === void 0 ? "[green]Confirm" : _e, _f = _b.cancelText, cancelText = _f === void 0 ? "[red]Cancel" : _f;
        return exports.Menu.menu(title, description, [confirmText, cancelText], target, { onCancel: "reject", cancelOptionId: 1 }).catch(function (e) {
            if (e === "cancel")
                (0, commands_1.fail)(cancelOutput);
            throw e; //some random error, rethrow it
        });
    },
    /** Same as confirm(), but with inverted colors, for potentially dangerous actions. */
    confirmDangerous: function (target, description, _a) {
        if (_a === void 0) { _a = {}; }
        var _b = _a.confirmText, confirmText = _b === void 0 ? "[red]Confirm" : _b, _c = _a.cancelText, cancelText = _c === void 0 ? "[green]Cancel" : _c, rest = __rest(_a, ["confirmText", "cancelText"]);
        return this.confirm(target, description, __assign({ cancelText: cancelText, confirmText: confirmText }, rest));
    },
};
