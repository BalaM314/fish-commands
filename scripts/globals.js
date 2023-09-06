"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipPattern = exports.uuidPattern = exports.fishState = exports.recentWhispers = exports.tileHistory = void 0;
exports.tileHistory = {};
exports.recentWhispers = {};
exports.fishState = {
    restarting: false,
    corruption_t1: null,
    corruption_t2: null,
    lastPranked: Date.now(),
};
exports.uuidPattern = /^[a-zA-Z0-9+/]{22}==$/;
exports.ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
