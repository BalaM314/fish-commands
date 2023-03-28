"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rank = void 0;
var Rank = /** @class */ (function () {
    function Rank(name, 
    /** Used to determine whether a rank outranks another. */ level, prefix) {
        this.name = name;
        this.level = level;
        this.prefix = prefix;
        Rank.ranks[name] = this;
    }
    Rank.getByName = function (name) {
        var _a;
        return (_a = this.ranks[name]) !== null && _a !== void 0 ? _a : null;
    };
    Rank.player = new Rank("player", 0, "");
    Rank.active = new Rank("active", 1, "[black]<[green]\uE800[black]>");
    Rank.trusted = new Rank("trusted", 2, "[black]<[blue]\uE84D[black]>");
    //icons and names subject to change
    Rank.mod = new Rank("mod", 3, "[black]<[green]M[black]>");
    Rank.admin = new Rank("admin", 4, "[black]<[scarlet]A[black]>");
    Rank.developer = new Rank("developer", 5, "[black]<[yellow]\uE80F[black]>"); //i want wrench rank
    Rank.manager = new Rank("manager", 6, "[black]<[scarlet]\uE82C[black]>");
    Rank.fish = new Rank("fish", 999, "[blue]>|||>[] "); //Might want to change this to like owner or something
    Rank.ranks = {};
    return Rank;
}());
exports.Rank = Rank;
