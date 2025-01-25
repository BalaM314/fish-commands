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
exports.listeners = exports.GUI_Confirm = exports.GUI_Page = exports.GUI_Cancel = exports.GUI_Container = void 0;
exports.registerListeners = registerListeners;
exports.menu = menu;
var commands_1 = require("./commands");
var players_1 = require("./players");
var utils_1 = require("./utils");
var funcs_1 = require("./funcs");
var funcs_2 = require("./funcs");
//#region Draw Menu
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
function menu(title, description, elements, target, callback) {
    target.activeMenu.cancelOptionId = -1;
    var ArrangedElements = { data: [], stringified: [] };
    elements.forEach(function (element) {
        var _a;
        (_a = ArrangedElements.data).push.apply(_a, __spreadArray([], __read(element.data()), false));
        if (element instanceof GUI_Cancel) {
            target.activeMenu.cancelOptionId = ArrangedElements.data.length;
        }
    });
    elements.forEach(function (element) {
        var _a;
        return (_a = ArrangedElements.stringified).push.apply(_a, __spreadArray([], __read(element.format()), false));
    });
    //flatten to arrays 
    var PackedElements = { data: ArrangedElements.data.flat(), stringified: ArrangedElements.stringified.flat() };
    if (PackedElements.data.length == 0) {
        ArrangedElements.stringified.push(["<No Options Provided>"]);
        ArrangedElements.data.push([null]); // not needed, but nice to keep data and string in sync.
    }
    if (!callback) {
        //overload 1, just display a menu with no callback
        Call.menu(target.con, registeredListeners.none, title, description, ArrangedElements.stringified);
    }
    else {
        //overload 2, display a menu with callback
        //The target fishPlayer has a property called activeMenu, which stores information about the last menu triggered.
        target.activeMenu.callback = function (_fishSender, option) {
            //Additional permission validation could be done here, but the only way that callback() can be called is if the above statement executed,
            //and on sensitive menus such as the stop menu, the only way to reach that is if menu() was called by the /stop command,
            //which already checks permissions.
            //Additionally, the callback is cleared by the generic menu listener after it is executed.
            //We do need to validate option though, as it can be any number.
            Log.info("Option ".concat(option, " in ").concat(PackedElements.data.length));
            if (!(option in PackedElements.data))
                return;
            if (typeof PackedElements.data[option] === 'string' && PackedElements.data[option] == "cancel") {
                return;
            } // cancel button pressed, no need to callback
            try {
                callback({
                    data: PackedElements.data[option],
                    text: PackedElements.stringified[option],
                    sender: target,
                    outputFail: function (message) { return (0, utils_1.outputFail)(message, target); },
                    outputSuccess: function (message) { return (0, utils_1.outputSuccess)(message, target); },
                });
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
        Call.menu(target.con, registeredListeners.generic, title, description, ArrangedElements.stringified);
    }
}
//#endregion
//#region Draw Page Menus
//draws a page menu with arbitrary pages
function pageMenu(title, description, elements, target, callback) {
    var pages = elements.length;
    function drawpage(index) {
        var e = [new GUI_Page(index + 1, pages)];
        e.push.apply(e, __spreadArray([], __read(elements[index]), false));
        menu(title, description, e, target, function (res) {
            if (typeof res.data === 'string') {
                switch (res.data) {
                    case "left":
                        drawpage((index == 0) ? (0) : (index - 1));
                        break;
                    case "right":
                        drawpage((index == pages - 1) ? (pages - 1) : (index + 1));
                        break;
                    case "center":
                        drawpage(index);
                        break;
                    default:
                        callback(res);
                }
            }
        });
        return;
    }
}
//auto formats a array into a page menu
//TODO make list a GUI_Element[] instead of a single Container
function listMenu(title, description, list, target, callback, pageSize) {
    if (pageSize === void 0) { pageSize = 10; }
    var buttons = { data: [], };
    list.data()[0].reduce(function (result, _, index) { if (index % pageSize === 0) {
        buttons.data.push(buttons.data.slice(index, index + pageSize));
    } return result; });
    var pages = [];
    buttons.data.forEach(function (page) { pages.push([new GUI_Container(page, 1, list.stringifier)]); }); //wrap each page in a container
    pageMenu(title, description, pages, target, callback);
}
//const reservedStrings = ["left", "center", "right"] // strings used for paged menus, cannot be handled correct
var GUI_Container = /** @class */ (function () {
    function GUI_Container(options, columns, stringifier) {
        if (columns === void 0) { columns = 3; }
        if (stringifier === void 0) { stringifier = function (option) { return option; }; }
        var _this = this;
        this.options = options;
        this.columns = columns;
        this.stringifier = stringifier;
        this.format = function () { return ((0, funcs_2.to2DArray)(_this.options.map(_this.stringifier), (_this.columns == 'auto') ? (3) : (_this.columns))); };
        this.data = function () { return (0, funcs_2.to2DArray)(_this.options, (_this.columns == 'auto') ? (3) : (_this.columns)); };
    }
    ;
    return GUI_Container;
}());
exports.GUI_Container = GUI_Container;
var GUI_Cancel = /** @class */ (function () {
    function GUI_Cancel() {
        this.format = function () { return ([["cancel"]]); };
        this.data = function () { return ([["cancel"]]); };
    }
    return GUI_Cancel;
}());
exports.GUI_Cancel = GUI_Cancel;
var GUI_Page = /** @class */ (function () {
    function GUI_Page(currentPage, pages) {
        var _this = this;
        this.currentPage = currentPage;
        this.pages = pages;
        this.format = function () { return ([["<--"], ["".concat(_this.currentPage, "/").concat(_this.pages)], ["-->"]]); };
        this.data = function () { return ([["left", "center", "left"]]); };
    }
    return GUI_Page;
}());
exports.GUI_Page = GUI_Page;
var GUI_Confirm = /** @class */ (function () {
    function GUI_Confirm() {
        this.format = function () { return [["[green]Yes, do it", "[red] No, cancel"]]; };
        this.data = function () { return [[true, false]]; };
    }
    return GUI_Confirm;
}());
exports.GUI_Confirm = GUI_Confirm;
