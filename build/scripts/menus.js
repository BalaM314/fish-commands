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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
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
/** Used to change the behavior of adding another menu when being run in a menu callback. */
var isInMenuCallback = false;
/** Stores a mapping from name to the numeric id of a listener that has been registered. */
var registeredListeners = {};
exports.listeners = registeredListeners;
/** Stores all listeners in use by fish-commands. */
var listeners = {
    generic: function (player, option) {
        var fishSender = players_1.FishPlayer.get(player);
        var prevCallback = fishSender.activeMenus.shift();
        if (!prevCallback)
            return; //No menu to process, do nothing
        isInMenuCallback = true;
        prevCallback.callback(option);
        isInMenuCallback = false;
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
    raw: function (title, description, arrangedOptions, target, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.optionStringifier, optionStringifier = _c === void 0 ? String : _c, _d = _b.onCancel, onCancel = _d === void 0 ? "ignore" : _d, _e = _b.cancelOptionId, cancelOptionId = _e === void 0 ? -1 : _e;
        var _f = promise_1.Promise.withResolvers(), promise = _f.promise, reject = _f.reject, resolve = _f.resolve;
        //The target fishPlayer has a property called activeMenu, which stores information about the last menu triggered.
        //If menu() is being called from a menu calback, add it to the front of the queue so it is processed before any other menus.
        //Otherwise, two multi-step menus queued together would alternate, which would confuse the player.
        target.activeMenus[isInMenuCallback ? "unshift" : "push"]({ callback: function (option) {
                //Additional permission validation could be done here, but the only way that callback() can be called is if the above statement executed,
                //and on sensitive menus such as the stop menu, the only way to reach that is if menu() was called by the /stop command,
                //which already checks permissions.
                //Additionally, the callback is cleared by the generic menu listener after it is executed.
                try {
                    var options = arrangedOptions.flat();
                    //We do need to validate option though, as it can be any number.
                    if (option === -1 || option === cancelOptionId || !(option in options)) {
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
            } });
        Call.menu(target.con, registeredListeners.generic, title, description, arrangedOptions.map(function (r) { return r.map(optionStringifier); }));
        return promise;
    },
    /** Displays a menu to a player, returning a Promise. Arranges options into a 2D array, and can add a Cancel option. */
    menu: function (title, description, options, target, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.includeCancel, includeCancel = _c === void 0 ? false : _c, _d = _b.optionStringifier, optionStringifier = _d === void 0 ? String : _d, _e = _b.columns, columns = _e === void 0 ? 3 : _e, _f = _b.onCancel, onCancel = _f === void 0 ? "ignore" : _f, _g = _b.cancelOptionId, cancelOptionId = _g === void 0 ? -1 : _g;
        //Set up the 2D array of options, and maybe add cancel
        //Call.menu() with [[]] will cause a client crash, make sure to pass [] instead
        var arrangedOptions = (options.length == 0 && !includeCancel) ? [] : (0, funcs_2.to2DArray)(options, columns);
        if (includeCancel) {
            arrangedOptions.push(["Cancel"]);
            //This is safe because cancelOptionId is set,
            //so the handler will never get called with "Cancel".
            cancelOptionId = options.length;
        }
        return exports.Menu.raw(title, description, arrangedOptions, target, {
            cancelOptionId: cancelOptionId,
            onCancel: onCancel,
            optionStringifier: optionStringifier
        });
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
        return exports.Menu.confirm(target, description, __assign({ cancelText: cancelText, confirmText: confirmText }, rest));
    },
    buttons: function (target, title, description, options, cfg) {
        if (cfg === void 0) { cfg = {}; }
        return exports.Menu.raw(title, description, options, target, __assign(__assign({}, cfg), { optionStringifier: function (o) { return o.text; } })).then(function (o) { return o === null || o === void 0 ? void 0 : o.data; });
    },
    pages: function (target, title, description, options, cfg) {
        var _a = promise_1.Promise.withResolvers(), promise = _a.promise, reject = _a.reject, resolve = _a.resolve;
        function showPage(index) {
            var opts = __spreadArray(__spreadArray([], __read(options[index].map(function (r) { return r.map(function (d) { return ({ text: d.text, data: [d.data] }); }); })), false), [
                [
                    { data: "left", text: "[".concat(index == 0 ? "gray" : "accent", "]<--") },
                    { data: "numbers", text: "[accent]".concat(index + 1, "/").concat(options.length) },
                    { data: "right", text: "[".concat(index == options.length - 1 ? "gray" : "accent", "]-->") }
                ]
            ], false);
            exports.Menu.buttons(target, title, description, opts, cfg).then(function (response) {
                if (response instanceof Array)
                    resolve(response[0]);
                else if (response === "right")
                    showPage(Math.min(index + 1, options.length - 1));
                else if (response === "left")
                    showPage(Math.max(index - 1, 0));
                else {
                    //Treat numbers as cancel
                    if (cfg.onCancel == "null")
                        resolve(null);
                    else if (cfg.onCancel == "reject")
                        reject("cancel");
                    //otherwise, just let the promise hang
                }
            });
        }
        showPage(0);
        return promise;
    },
    pagedListButtons: function (target, title, description, options, _a) {
        var _b = _a.rowsPerPage, rowsPerPage = _b === void 0 ? 10 : _b, _c = _a.columns, columns = _c === void 0 ? 3 : _c, cfg = __rest(_a, ["rowsPerPage", "columns"]);
        //Generate pages
        var pages = (0, funcs_2.to2DArray)((0, funcs_2.to2DArray)(options, columns), rowsPerPage);
        if (pages.length == 1)
            return exports.Menu.buttons(target, title, description, pages[0], cfg);
        return exports.Menu.pages(target, title, description, pages, cfg);
    },
    pagedList: function (target, title, description, options, _a) {
        var _b = _a.rowsPerPage, rowsPerPage = _b === void 0 ? 10 : _b, _c = _a.columns, columns = _c === void 0 ? 3 : _c, optionStringifier = _a.optionStringifier, cfg = __rest(_a, ["rowsPerPage", "columns", "optionStringifier"]);
        //Generate pages
        var pages = (0, funcs_2.to2DArray)((0, funcs_2.to2DArray)(options.map(function (o) { return ({ data: o, get text() { return optionStringifier(o); } }); }), columns), rowsPerPage);
        if (pages.length == 1)
            return exports.Menu.buttons(target, title, description, pages[0], cfg);
        return exports.Menu.pages(target, title, description, pages, cfg);
    }
};
