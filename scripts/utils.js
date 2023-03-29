"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setToArray = exports.isCoreUnitType = exports.nearbyEnemyTile = exports.getColor = exports.to2DArray = exports.getTimeSinceText = exports.memoize = exports.keys = exports.list = exports.logg = void 0;
function logg(msg) { Call.sendMessage(msg); }
exports.logg = logg;
function list(ar) { Call.sendMessage(ar.join(' | ')); }
exports.list = list;
function keys(obj) { Call.sendMessage(Object.keys(obj).join(' [scarlet]|[white] ')); }
exports.keys = keys;
var storedValues = {};
/**
 * Stores the output of a function and returns that value
 * instead of running the function again unless any
 * dependencies have changed to improve performance with
 * functions that have expensive computation.
 * @param callback function to run if a dependancy has changed
 * @param dep dependency array of values to monitor
 * @param id arbitrary unique id of the function for storage purposes.
 */
function memoize(callback, dep, id) {
    if (!storedValues[id]) {
        storedValues[id] = { value: callback(), dep: dep };
    }
    else if (dep.some(function (d, ind) { return d !== storedValues[id].dep[ind]; })) {
        //If the value changed
        storedValues[id].value = callback();
        storedValues[id].dep = dep;
    }
    return storedValues[id].value;
}
exports.memoize = memoize;
/**
 * Returns the amount of time passed since the old time in a readable format.
 */
function getTimeSinceText(old) {
    var timePassed = Date.now() - old;
    var hours = Math.floor((timePassed / (1000 * 60 * 60)) % 24);
    var minutes = Math.floor(timePassed / 60000);
    var seconds = Math.floor((timePassed % 60000) / 1000);
    var timeSince = '';
    if (hours)
        timeSince += "[green]".concat(hours, " [lightgray]hrs, ");
    if (minutes)
        timeSince += "[green]".concat(minutes, " [lightgray]mins, ");
    timeSince += "[green]".concat(seconds, " [lightgray]secs ago.");
    return timeSince;
}
exports.getTimeSinceText = getTimeSinceText;
;
function to2DArray(array, width) {
    var output = [[]];
    array.forEach(function (el) {
        if (output.at(-1).length >= width) {
            output.push([]);
        }
        output.at(-1).push(el);
    });
    return output;
}
exports.to2DArray = to2DArray;
function getColor(input) {
    try {
        if (input.includes(',')) {
            var formattedColor = input.split(',');
            var col = {
                r: Number(formattedColor[0]),
                g: Number(formattedColor[1]),
                b: Number(formattedColor[2]),
                a: 255,
            };
            return new Color(col.r, col.g, col.b, col.a);
        }
        else if (input.includes('#')) {
            return Color.valueOf(input);
        }
        else if (input in Color) {
            return Color[input];
        }
        else {
            return null;
        }
    }
    catch (e) {
        return null;
    }
}
exports.getColor = getColor;
function nearbyEnemyTile(unit, dist) {
    var x = Math.floor(unit.x / Vars.tilesize);
    var y = Math.floor(unit.y / Vars.tilesize);
    for (var i = -dist; i <= dist; i++) {
        for (var j = -dist; j <= dist; j++) {
            var build = Vars.world.build(x + i, y + j);
            if (build && build.team != unit.team)
                return build;
        }
    }
    return null;
}
exports.nearbyEnemyTile = nearbyEnemyTile;
/**
 * This function is necessary due to a bug with UnitChangeEvent. It can be removed in the next release after v142.
 * @deprecated
 * */
function isCoreUnitType(type) {
    return [UnitTypes.alpha, UnitTypes.beta, UnitTypes.gamma, UnitTypes.evoke, UnitTypes.incite, UnitTypes.emanate].includes(type);
}
exports.isCoreUnitType = isCoreUnitType;
function setToArray(set) {
    var array = [];
    set.each(function (item) { return array.push(item); });
    return array;
}
exports.setToArray = setToArray;
