"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteManager = void 0;
var players_1 = require("./players");
var utils_js_1 = require("./utils.js");
var VoteManager = /** @class */ (function (_super) {
    __extends(VoteManager, _super);
    function VoteManager(voteTime, goal) {
        if (goal === void 0) { goal = 0.50001; }
        var _this = _super.call(this) || this;
        _this.voteTime = voteTime;
        _this.goal = goal;
        _this.votes = new Map();
        _this.timer = null;
        _this.active = false;
        Events.on(EventType.PlayerLeave, function (_a) {
            var player = _a.player;
            //Run once the player has been removed, but resolve the player first in case the connection gets nulled
            var fishP = players_1.FishPlayer.get(player);
            Core.app.post(function () { return _this.unvote(fishP); });
        });
        Events.on(EventType.GameOverEvent, function () { return _this.resetVote(); });
        return _this;
    }
    VoteManager.prototype.start = function (player, value) {
        var _this = this;
        this.active = true;
        this.timer = Timer.schedule(function () { return _this._checkVote(false); }, this.voteTime / 1000);
        this.vote(player, value);
    };
    VoteManager.prototype.vote = function (player, newVote) {
        if (!this.active)
            return this.start(player, newVote);
        var oldVote = this.votes.get(player.uuid);
        this.votes.set(player.uuid, newVote);
        if (oldVote == null)
            this.fire("player vote", [player, newVote]);
        this.fire("player vote change", [player, oldVote !== null && oldVote !== void 0 ? oldVote : 0, newVote]);
        this._checkVote(false);
    };
    VoteManager.prototype.unvote = function (player) {
        if (!this.active)
            return;
        var fishP = players_1.FishPlayer.resolve(player);
        var vote = this.votes.get(fishP.uuid);
        if (vote) {
            this.fire("player vote removed", [player, vote]);
            this._checkVote(false);
        }
        else {
            Log.err("Cannot remove nonexistent vote for player with uuid ".concat(fishP.uuid));
        }
    };
    /** Does not fire the events used to display messages, please print one before calling this */
    VoteManager.prototype.forceVote = function (force) {
        if (force) {
            this.fire("success", [true]);
        }
        else {
            this.fire("fail", [true]);
        }
    };
    VoteManager.prototype.resetVote = function () {
        if (this.timer != null)
            this.timer.cancel();
        this.votes.clear();
        this.active = false;
    };
    VoteManager.prototype.getGoal = function () {
        //TODO discount AFK players
        return Math.ceil(this.goal * Groups.player.size());
    };
    VoteManager.prototype.scoreVotes = function () {
        return __spreadArray([], __read(this.votes), false).reduce(function (acc, _a) {
            var _b = __read(_a, 2), k = _b[0], v = _b[1];
            return acc + v;
        }, 0);
    };
    VoteManager.prototype._checkVote = function (end) {
        var votes = this.scoreVotes();
        var required = this.getGoal();
        if (votes >= required) {
            this.fire("success", [false]);
            this.fire("vote passed", [votes, required]);
            this.resetVote();
        }
        else if (end) {
            this.fire("fail", [false]);
            this.fire("vote failed", [votes, required]);
            this.resetVote();
        }
    };
    return VoteManager;
}(utils_js_1.EventEmitter));
exports.VoteManager = VoteManager;
