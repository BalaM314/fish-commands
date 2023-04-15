"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rank = void 0;
var Rank = exports.Rank = /** @class */ (function () {
    function Rank(name, 
    /** Used to determine whether a rank outranks another. */ level, prefix, color) {
        if (color === void 0) { color = ""; }
        this.name = name;
        this.level = level;
        this.prefix = prefix;
        this.color = color;
        Rank.ranks[name] = this;
    }
    Rank.getByName = function (name) {
        var _a;
        return (_a = this.ranks[name]) !== null && _a !== void 0 ? _a : null;
    };
    Rank.ranks = {};
    Rank.new = new Rank("new", -1, "", "[forest]");
    Rank.player = new Rank("player", 0, "", "");
    Rank.trusted = new Rank("trusted", 2, "[black]<[#E67E22]\uE813[]>[]", "[#E67E22]");
    //icons and names subject to change
    Rank.mod = new Rank("mod", 3, "[black]<[#6FFC7C]\uE817[]>[]", "[#6FFC7C]");
    Rank.admin = new Rank("admin", 4, "[black]<[#C30202]\uE82C[]>[]", "[#C30202]");
    Rank.developer = new Rank("developer", 5, "[black]<[#B000FF]\uE80E[]>[]", "[#B000FF]");
    Rank.pi = new Rank("pi", 9, "[black]<[#FF8000]\u03C0[]>[]", "[blue]"); //i want rank
    Rank.manager = new Rank("manager", 10, "[black]<[scarlet]\uE88E[]>[]", "[scarlet]");
    Rank.fish = new Rank("fish", 999, "[blue]>|||>[] ", "[blue]"); //Might want to change this to like owner or something
    return Rank;
}());
