"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipJoins = exports.ipPortPattern = exports.ipPattern = exports.uuidPattern = exports.fishState = exports.recentWhispers = exports.tileHistory = void 0;
exports.tileHistory = {};
exports.recentWhispers = {};
exports.fishState = {
    restartQueued: false,
    restartLoopTask: null,
    corruption_t1: null,
    corruption_t2: null,
    lastPranked: Date.now(),
};
exports.uuidPattern = /^[a-zA-Z0-9+/]{22}==$/;
exports.ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
exports.ipPortPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/;
exports.ipJoins = new ObjectIntMap(); //todo somehow tell java that K is String and not Object
