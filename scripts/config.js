"use strict";
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
exports.heuristics = exports.tips = exports.maxTime = exports.localDebug = exports.Mode = exports.getGamemode = exports.FishServers = exports.ip = exports.multiCharSubstitutions = exports.substitutions = exports.adminNames = exports.bannedInNamesWords = exports.strictBannedWords = exports.bannedWords = exports.MUTED_PREFIX = exports.MARKED_PREFIX = void 0;
exports.MARKED_PREFIX = '[yellow]\u26A0[scarlet]Marked Griefer[]\u26A0[]';
exports.MUTED_PREFIX = '[white](muted)';
exports.bannedWords = (function (words) {
    return words.map(function (word) { return (typeof word == "string" || word instanceof RegExp) ? [word, []] : [word[0], word.slice(1)]; });
})([
    "uwu",
    "nig" + "ger", "nig" + "ga", "niger",
    "re" + "tard", 'kill yourself', 'kill urself', ['kys', "skys", "pokys", "sneakys"], "co" + "ck", "iamasussyimposter", "cu" + "nt",
    ["rape", "grape", "therap", "drape", "scrape", "trapez"],
    ["fa" + "g", "half", "ago"],
    /\bcum\b/,
    "porn", "ur gay", "your gay", "youre gay", "you're gay"
]);
exports.strictBannedWords = (function (words) {
    return words.map(function (word) { return (typeof word == "string" || word instanceof RegExp) ? [word, []] : [word[0], word.slice(1)]; });
})([
    "fu" + "ck", "bi" + "tch", ["sh" + "it", "harshit"],
]);
exports.bannedInNamesWords = (function (words) {
    return words.map(function (word) { return (typeof word == "string" || word instanceof RegExp) ? [word, []] : [word[0], word.slice(1)]; });
})([
    "sex", /\bgoldberg\b/, "hitler", "stalin", "putin", "lenin", /^something$/
]);
exports.adminNames = ["fish", "balame14", "xyralith", "firefridge", "clashgone", "hawo", "eternal hawo", "aricia", "yin", "yang", "rawsewage", "raw sewage"];
//for some reason the external mindustry server does not read the files correctly, so we can only use ASCII
exports.substitutions = Object.fromEntries(Object.entries({
    "a": ["\u0430", "\u1E9A", "\u1EA1", "\u1E01", "\u00E4", "\u03B1", "@", "\u0101", "\u0103", "\u0105"],
    "b": ["\u1E03", "\u1E07", "\u1E03", "\u0253", "\u0185"],
    "c": ["\u0441", "\u217D", "\u00E7", "\u03C2", "\u010B"],
    "d": ["\u217E", "\u1E0B", "\u1E11", "\u010F", "\u1E13", "\u1E0D", "\u1E0F", "\u0257", "\u20AB", "\u0256", "\u056A"],
    "e": ["\u0435", "\u1E1B", "\u0113", "\u1E17", "\u0229", "\u0451", "\u011B", "\u0205", "\u03F5", "\u03B5", "\u025B", "3"],
    "f": ["\u1E1F", "\u0493", "\u0192"],
    "g": ["\u0581", "\u0123", "\u01F5", "\u0260", "\u011F", "\u011D", "\u01E5", "\u1E21"],
    "h": ["\u1E23", "\u021F", "\u1E25", "\u1E2B", "\u0570", "\u056B", "\u1E29", "\u0266", "\u1E27", "\u1E23", "\u0266", "\u1E96", "\u0127"],
    "i": ["\u0456", "\u012F", "\u03B9", "\u1EC9", "\u1F31", "\u1F77", "\u012B", "1"],
    "j": ["\u0458", "\u029D", "\u0575", "\u025F", "\u0135", "\u0237", "\u01F0"],
    "k": ["\u049F", "\u1E31", "\u0137", "\u0138", "\u043A", "\u0199", "\u049D"],
    "l": ["\u217C", "\u1E3D", "\u1E3B", "\u013E", "\u0140", "\u013C", "\u1E39", "\u0142", "\u038A", "\u00CC", "\u00CD", "\u00CE", "\u00CF", "\u0128", "\u012A", "\u012C", "\u012E", "\u0130", "\u0196", "\u0208", "\u020A", "\u0399", "\u03AA", "\u0406", "\u0407", "\u04C0", "\u04CF", "\u1E2C", "\u1EC8", "\u1F38", "\u1F39", "\u1FD8", "\u1FD9", "\u1FDA", "\u01D0"],
    "m": ["\u217F", "\u1E43", "\u0271", "\u1E41", "\u1E3F"],
    "n": ["\u00F1", "\u0144", "\u0146", "\u0148", "\u0149", "\u01F9", "\u03AE", "\u03B7", "\u0578", "\u057C", "\u0580", "\u1E45", "\u1E47"],
    "o": ["\u00F2", "\u1ED9", "\u1EDB", "\u1EDD", "\u1EDF", "\u1EE1", "\u1EE3", "\u1F40", "\u1F41", "\u1F42", "\u1F43", "\u1F44", "\u1F45", "\u1F78", "\u1F79", "\u03C3", "\u0E50", "\u00F6", "\u014D", "\u014F", "\u0151", "\u01A1", "\u01D2", "0"],
    "p": ["\u03C1", "\u0440", "\u048F", "\u1E55", "\u1E57", "\u1FE4", "\u1FE5", "\u2374"],
    "q": ["\u051B", "\u0563", "\u0566", "\u0563", "\u0566"],
    "r": ["\u0155", "\u0157", "\u0159", "\u0211", "\u0213", "\u027C", "\u027D", "\u0433", "\u0453", "\u0491", "\u04F7", "\u1E59", "\u1E5B", "\u1E5D"],
    "s": ["\u015B", "\u015D", "\u015F", "\u0161", "\u0219", "\u0282", "\u0455", "\u1E61", "\u1E63", "\u1E65", "\u1E67", "\u1E69"],
    "t": ["\u0163", "\u0165", "\u01AB", "\u021B", "\u0288", "\u1E6B", "\u1E6D", "\u1E6F", "\u1E71", "\u1E97", "\u0236", "\u2020", "\u04AD"],
    "u": ["\u00B5", "\u03BC", "\u00F9", "\u00FA", "\u00FB", "\u00FC", "\u0169", "\u016B", "\u016D", "\u016F", "\u0171", "\u0173", "\u01B0", "\u01D4", "\u0215", "\u0217", "\u0265", "\u1EE9", "\u1EEB", "\u1EED", "\u1EEF", "\u1EF1"],
    "v": ["\u03BD", "\u0475", "\u0477", "\u1E7D", "\u1E7F", "\u2174", "\u2228"],
    "w": ["\u0175", "\u051D", "\u1E81", "\u1E83", "\u1E85", "\u1E87", "\u1E89", "\u1E98"],
    "x": ["\u0445", "\u04B3", "\u1E8B", "\u1E8D"],
    "y": ["\u00FD", "\u00FF", "\u0177", "\u01B4", "\u0233", "\u03B3", "\u0443", "\u045E", "\u04EF", "\u04F1", "\u04F3", "\u1E8F", "\u1E99", "\u1EF3", "\u1EF5", "\u1EF7", "\u1EF9", "\u04AF", "\u04B1"],
    "z": ["\u017A", "\u017C", "\u017E", "\u01B6", "\u0225", "\u0290", "\u1E91", "\u1E93", "\u1E95"],
    "A": ["\u1E00", "\u1EA0", "\u1EA2", "\u1EA4", "\u1EA6", "\u1EA8", "\u1EAC", "\u1F08", "\u1F09", "\u1F88", "\u1F89", "\u1FB8", "\u1FB9", "\u1FBA", "\u1FBC", "\u212B", "\u0100", "\u0102", "\u0104"],
    "B": ["\u0181", "\u0392", "\u0412", "\u1E02", "\u1E04", "\u1E06"],
    "C": ["\u00C7", "\u0106", "\u0108", "\u010A", "\u010C", "\u0187", "\u0421", "\u04AA", "\u1E08", "\u216D", "\u03F9"],
    "D": ["\u00D0", "\u010E", "\u0110", "\u0189", "\u018A", "\u1E0A", "\u1E0C", "\u1E0E", "\u216E"],
    "E": ["\u00C8", "\u00C9", "\u00CA", "\u00CB", "\u0112", "\u0114", "\u0116", "\u0118", "\u011A", "\u0204", "\u0206", "\u0228", "\u0395", "\u0400", "\u0415", "\u04D6", "\u1E18", "\u0510", "\u2107", "\u0190", "\u1F19", "\u1FC8", "\u0404"],
    "F": ["\u03DC", "\u1E1E", "\u0492", "\u0191", "\u0492", "\u0493"],
    "G": ["\u011C", "\u011E", "\u0120", "\u0122", "\u0193", "\u01E6", "\u01F4", "\u1E20"],
    "H": ["\u0124", "\u021E", "\u0397", "\u041D", "\u04A2", "\u04A4", "\u04C7", "\u04C9", "\u1E22", "\u1E24", "\u1E26", "\u1E28", "\u1E2A", "\u1FCC", "\uA726"],
    "I": ["\u038A", "\u00CC", "\u00CD", "\u00CE", "\u00CF", "\u0128", "\u012A", "\u012C", "\u012E", "\u0130", "\u0196", "\u0208", "\u020A", "\u0399", "\u03AA", "\u0406", "\u0407", "\u04C0", "\u04CF", "\u1E2C", "\u1EC8", "\u1F38", "\u1F39", "\u1FD8", "\u1FD9", "\u1FDA", "\u01D0", "\u217C", "\u1E3D", "\u1E3B", "\u026B", "\u013E", "\u0140", "\u013C", "\u1E39"],
    "J": ["\u0134", "\u0408"],
    "K": ["\u0136", "\u0198", "\u01E8", "\u039A", "\u040C", "\u041A", "\u051E", "\u1E30", "\u1E32", "\u1E34", "\u20AD", "\u212A"],
    "L": ["\u0139", "\u013B", "\u013D", "\u013F", "\u0141", "\u053C", "\u1E36", "\u1E38", "\u1E3A", "\u1E3C", "\u216C"],
    "M": ["\u039C", "\u041C", "\u04CD", "\u1E3E", "\u1E40", "\u1E42", "\u216F"],
    "N": ["\u00D1", "\u0143", "\u0145", "\u0147", "\u01F8", "\u039D", "\u1E44", "\u1E46", "\u1E48", "\u1E4A", "\u019D"],
    "O": ["\u03B8", "\u236C", "\u00D2", "\u00D3", "\u00D4", "\u00D5", "\u00D6", "\u014C", "\u014E", "\u0150", "\u019F", "\u01A0", "\u01D1", "\u020E", "\u022E", "\u0230", "\u0398", "\u039F", "\u041E", "\u04E6", "\u0555", "\u1ECC", "\u1ECE", "\u1ED4", "\u1FF9", "\u038C"],
    "P": ["\u01A4", "\u03A1", "\u0420", "\u048E", "\u1E54", "\u1E56", "\u1FEC"],
    "Q": ["\u051A"],
    "R": ["\u0154", "\u0156", "\u0158", "\u0210", "\u0212", "\u1E58", "\u1E5A", "\u1E5C", "\u1E5E", "\u211E", "\u024C", "\u2C64"],
    "S": ["\u015A", "\u015C", "\u015E", "\u0160", "\u0218", "\u0405", "\u054F", "\u1E60", "\u1E62", "\u1E68", "\u1E64", "\u1E66"],
    "T": ["\u0162", "\u0164", "\u0166", "\u01AE", "\u021A", "\u03A4", "\u0422", "\u04AC", "\u1E6A", "\u1E6C", "\u1E6E", "\u1E70", "\u038A", "\u1FDB", "\uA68C"],
    "U": ["\u016A", "\u016C", "\u016E", "\u0170", "\u0172", "\u01AF", "\u01D3", "\u1EE8", "\u1EEA", "\u1EEC", "\u1EEE", "\u0544"],
    "V": ["\u0474", "\u0476", "\u1E7C", "\u1E7E", "\u22C1", "\u2164"],
    "W": ["\u051C", "\u1E80", "\u1E82", "\u1E84", "\u1E86", "\u1E88", "\u019C"],
    "X": ["\u03A7", "\u0425", "\u04B2", "\u1E8A", "\u1E8C", "\u2169"],
    "Y": ["\u01B3", "\u0232", "\u03A5", "\u03AB", "\u03D3", "\u0423", "\u04AE", "\u04B0", "\u1E8E", "\u1EF2", "\u1EF4"],
    "Z": ["\u0179", "\u017B", "\u017D", "\u0224", "\u0396", "\u1E90", "\u1E92", "\u1E94"],
}).map(function (_a) {
    var _b = __read(_a, 2), char = _b[0], alts = _b[1];
    return alts.map(function (alt) { return [alt, char]; });
}).flat(1));
exports.multiCharSubstitutions = [
    [/\|-\|/g, "H"]
];
// export const ip = 'localhost';
exports.ip = '45.79.202.111';
exports.FishServers = {
    attack: { ip: "162.248.100.98", port: "6567" },
    survival: { ip: "162.248.101.95", port: "6567" },
    pvp: { ip: "162.248.100.133", port: "6567" },
    // sandbox: { ip: "162.248.102.204", port: "6567" },
};
var getGamemode = function () { return Vars.state.rules.mode().name(); };
exports.getGamemode = getGamemode;
exports.Mode = {
    attack: function () { return (0, exports.getGamemode)() == "attack"; },
    survival: function () { return (0, exports.getGamemode)() == "survival"; },
    pvp: function () { return (0, exports.getGamemode)() == "pvp"; },
    sandbox: function () { return (0, exports.getGamemode)() == "sandbox"; },
};
exports.localDebug = new Fi("config/.debug").exists();
exports.maxTime = 9999999999999;
exports.tips = {
    ads: [
        "[pink]Fish Membership[] subscribers can access the [pink]/pet[] command, which spawns a merui that follows you around. Get a Fish Membership at[sky] https://patreon.com/FishServers []",
        "[pink]Fish Membership[] subscribers can use the [pink]/highlight[] command, which turns your chat messages to a color of your choice. Get a Fish Membership at[sky] https://patreon.com/FishServers []",
        "[pink]Fish Membership[] subscribers can use the [pink]/rainbow[] command, which makes your name flash different colors. Get a Fish Membership at[sky] https://patreon.com/FishServers []",
        "Want to support the server and get some perks? Get a [pink]Fish Membership[] at[sky] https://patreon.com/FishServers []",
        "Join our [#7289da]Discord server[]![#7289da] https://discord.gg/VpzcYSQ33Y",
    ],
    normal: [
        //commands
        "You can spawn an [scarlet]Ohno[] with the [scarlet]/ohno[] command. Ohnos are harmless creatures that were created by fusing an alpha and an atrax.",
        "Ohnos cannot be spawned near enemy buildings, because they are peaceful and do not want to be used for attacks.",
        "You can use [white]/tp[] to teleport directly to any other player! (But only when you're in a core unit)",
        "Hate boulders? You can remove them with [white]/clean[].",
        // `You can kill your unit by running [white]/die[].`,
        "We have a tilelog system to help catch griefers. Run [white]/tilelog[], then click a tile to see what's happened there.",
        "Run [white]/tilelog 1[] to check the tile history of multiple tiles.",
        "Tilelog stores when a building is placed, broken, rotated, configured, and picked up/dropped by a payload unit. Access it with [white]/tilelog[]",
        "Tilelog doesn't just log tile actions, it also logs unit deaths! Access it with [white]/tilelog[]",
        "You can mark yourself as AFK(away from keyboard) with [white]/afk[].",
        "Run /survival, /attack, or /pvp to quickly change to another server.",
        "Need to get rid of an active griefer? Use [#6FFC7C]/s[] to send a message to all staff members across all servers.",
        "Use [white]/help to get more information about a specific command.",
        "If you want to send a message to just one player, you can use the [white]/msg[] command.",
        "Use [white]/r[] to reply to a message sent by another player.",
        "[white]/trail[] can be used to give your unit a trail of particle effects.",
        "Run [white]/ranks[] to see all the ranks on our server.",
        "Is someone impersonating a staff member? Run [white]/rank[] to see their real rank.",
        //misc
        "Anyone attempting to impersonate a ranked player, or the server, will have [scarlet]SUSSY IMPOSTOR[] prepended to their name. Beware!",
        "Griefers will often be found with the text ".concat(exports.MARKED_PREFIX, " prepended to their name."),
        "Players marked as [yellow]\u26A0[orange]Flagged[]\u26A0[] have been flagged as suspicious by our detection systems, but they may not be griefers.",
        "Need to appeal a moderation action? Join the discord at [#7289da]https://discord.gg/VpzcYSQ33Y[]",
        "Want to send the phrase [white]\"/command\"[] in chat? Type [white]\"./command\"[] and the [white].[] will be removed.",
        "All commands with a player as an argument support using a menu to specify the player. Just run the command leaving the argument blank, and a menu will show up.",
    ],
    staff: []
};
exports.heuristics = {
    blocksBrokenAfterJoin: 50
};
