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
var VoteManager = /** @class */ (function () {
    function VoteManager(onSuccess, onFail, 
    //I hate that this is inconsistant, but its the best setup 
    onVote, onUnVote) {
        this.onSuccess = onSuccess;
        this.onFail = onFail;
        this.onVote = onVote;
        this.onUnVote = onUnVote;
        this.votes = new Map();
        this.goal = 0;
        this.timer = null;
        this.active = false;
    } //TODO:PR use builder pattern to clarify call site
    VoteManager.prototype.start = function (player, value, voteTime, threshold) {
        var _this = this;
        this.goal = threshold; //TODO:PR shouldn't this be a constant instance property?
        this.active = true;
        this.timer = Timer.schedule(function () { return _this.end(); }, voteTime / 1000);
        this.vote(player, value);
    };
    VoteManager.prototype.end = function () {
        if (!this.checkVote()) {
            this.failed();
        }
    };
    VoteManager.prototype.vote = function (player, value) {
        if (!this.active || player == null || player.usid == null)
            return; //no vote is going on
        this.votes.set(player.uuid, value);
        Log.info("Player voted, Name : ".concat(player.name, ",UUID : ").concat(player.uuid));
        this.onVote(player);
        this.checkVote();
    };
    //unused unvote taking a fish player, useful if we ever add an unvote command
    VoteManager.prototype.unvoteFish = function (player) {
        if (!this.active || player == null || player.uuid == null)
            return;
        if (!this.votes.delete(player.uuid))
            Log.err("Failed to Unvote Player uuid:".concat(player.uuid));
        this.onUnVote(player);
        this.checkVote();
    };
    //unvote with a mindustry player, which occurs during a playerleave event.
    //I hate this method with a passion
    VoteManager.prototype.unvoteMindustry = function (player) {
        if (!this.active || player == null)
            return;
        if (!this.votes.delete(player.uuid()))
            Log.err("Failed to Unvote Player uuid:".concat(player.uuid()));
        this.onUnVote(player);
        this.checkVote();
    };
    VoteManager.prototype.forceVote = function (force) {
        if (!this.active)
            return;
        if (force)
            this.succeeded();
        else
            this.failed();
    };
    VoteManager.prototype.failed = function () {
        this.resetVote(); //TODO:PR wrong order
        this.onFail();
    };
    VoteManager.prototype.succeeded = function () {
        this.resetVote(); //TODO:PR wrong order
        this.onSuccess();
    };
    VoteManager.prototype.resetVote = function () {
        if (this.timer != null)
            this.timer.cancel();
        this.votes.clear();
        this.active = false;
    };
    VoteManager.prototype.getGoal = function () {
        return Math.min(this.goal, Groups.player.size());
    };
    VoteManager.prototype.scoreVotes = function () {
        return __spreadArray([], __read(this.votes), false).reduce(function (acc, _a) {
            var _b = __read(_a, 2), k = _b[0], v = _b[1];
            return acc + v;
        }, 0);
    };
    VoteManager.prototype.checkVote = function () {
        if (this.scoreVotes() >= this.getGoal()) { //TODO:PR bad logic
            this.succeeded();
            return true;
        }
        return false;
    };
    return VoteManager;
}());
exports.VoteManager = VoteManager;
