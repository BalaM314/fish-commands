"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FishServers = exports.ip = exports.bannedNames = exports.bannedWords = exports.MEMBER_PREFIX = exports.MUTED_PREFIX = exports.AFK_PREFIX = exports.MOD_PREFIX = exports.ADMIN_PREFIX = exports.STOPPED_PREFIX = void 0;
exports.STOPPED_PREFIX = '[yellow]\u26A0[scarlet]Marked Griefer[yellow]\u26A0[white]';
exports.ADMIN_PREFIX = '[black]<[scarlet]A[black]>';
exports.MOD_PREFIX = '[black]<[green]M[black]>';
exports.AFK_PREFIX = '[orange]\uE876 AFK \uE876 | [white]';
exports.MUTED_PREFIX = '[white](muted)';
exports.MEMBER_PREFIX = '[black]<[yellow]\uE809[black]>[white]';
exports.bannedWords = ['nigger', 'kill yourself', 'kill urself', 'kys', 'cock', 'cock sucker', "iamasussyimposter"];
exports.bannedNames = ['goldberg', 'eshay', "VALVE"];
// const ip = 'localhost';
exports.ip = '45.79.202.111';
exports.FishServers = {
    attack: { ip: "162.248.100.98", port: "6567" },
    survival: { ip: "170.187.144.235", port: "6567" },
    pvp: { ip: "162.248.100.133", port: "6567" },
    sandbox: { ip: "162.248.102.204", port: "6567" },
};
