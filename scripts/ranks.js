"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rank = void 0;
var Rank = /** @class */ (function () {
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
    Rank.trusted = new Rank("trusted", 2, "[black]<[blue]\uE84D[black]>", "[yellow]");
    //icons and names subject to change
    Rank.mod = new Rank("mod", 3, "[black]<[green]M[black]>", "[acid]");
    Rank.admin = new Rank("admin", 4, "[black]<[scarlet]A[black]>", "[cyan]");
    Rank.developer = new Rank("developer", 5, "[black]<[yellow]\uE80F[black]>", "[orange]"); //i want wrench rank
    Rank.manager = new Rank("manager", 6, "[black]<[scarlet]\uE82C[black]>", "[scarlet]");
    Rank.fish = new Rank("fish", 999, "[blue]>|||>[] ", "[blue]"); //Might want to change this to like owner or something
    return Rank;
}());
exports.Rank = Rank;
