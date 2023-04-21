"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rank = void 0;
var Rank = exports.Rank = /** @class */ (function () {
    function Rank(name, 
    /** Used to determine whether a rank outranks another. */ level, description, prefix, color) {
        if (color === void 0) { color = ""; }
        this.name = name;
        this.level = level;
        this.description = description;
        this.prefix = prefix;
        this.color = color;
        Rank.ranks[name] = this;
    }
    Rank.getByName = function (name) {
        var _a;
        return (_a = this.ranks[name]) !== null && _a !== void 0 ? _a : null;
    };
    Rank.ranks = {};
    Rank.new = new Rank("new", -1, "For new players.", "", "[forest]");
    Rank.player = new Rank("player", 0, "Ordinary players.", "");
    Rank.trusted = new Rank("trusted", 2, "Trusted players who have gained the trust of a mod or admin.", "[black]<[#E67E22]\uE813[]>[]", "[#E67E22]");
    //icons and names subject to change
    Rank.mod = new Rank("mod", 3, "Moderators who can mute, stop, and kick players.", "[black]<[#6FFC7C]\uE817[]>[]", "[#6FFC7C]");
    Rank.admin = new Rank("admin", 4, "Administrators with the power to ban players.", "[black]<[#C30202]\uE82C[]>[]", "[#C30202]");
    Rank.developer = new Rank("developer", 5, "Awarded to people who contribute to the server's codebase.", "[black]<[#B000FF]\uE80E[]>[]", "[#B000FF]");
    Rank.manager = new Rank("manager", 10, "Managers have file and console access.", "[black]<[scarlet]\uE88E[]>[]", "[scarlet]");
    Rank.pi = new Rank("pi", 11, "3.14159265358979323846264338327950288419716", "[black]<[#FF8000]\u03C0[]>[]", "[blue]"); //i want pi rank
    Rank.fish = new Rank("fish", 999, "Owner.", "[blue]>|||>[] ", "[blue]"); //Might want to change this to like owner or something
    return Rank;
}());
