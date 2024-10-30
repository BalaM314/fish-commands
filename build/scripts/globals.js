"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains mutable global variables, and global constants.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipRangeWildcardPattern = exports.ipRangeCIDRPattern = exports.ipPortPattern = exports.ipPattern = exports.uuidPattern = exports.ipJoins = exports.fishState = exports.recentWhispers = exports.tileHistory = void 0;
exports.tileHistory = {};
exports.recentWhispers = {};
exports.fishState = {
    restartQueued: false,
    restartLoopTask: null,
    corruption_t1: null,
    corruption_t2: null,
    lastPranked: Date.now(),
    labels: [],
    peacefulMode: false,
};
exports.ipJoins = new ObjectIntMap(); //todo somehow tell java that K is String and not Object
exports.uuidPattern = /^[a-zA-Z0-9+/]{22}==$/;
exports.ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
exports.ipPortPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/;
exports.ipRangeCIDRPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/(1[2-9]|2[0-4])$/; //Disallow anything bigger than a /12
exports.ipRangeWildcardPattern = /^(\d{1,3}\.\d{1,3})\.(?:(\d{1,3}\.\*)|\*)$/; //Disallow anything bigger than a /16
