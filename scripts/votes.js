"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteManager = void 0;
var VoteManager = /** @class */ (function () {
    function VoteManager(onSuccess, // implementation handle vote success
    onFail, // implementation handle vote fail
    //I hate that this is inconsistant, but its the best setup 
    onVote, // implemenation handle player voting
    onUnVote) {
        this.onSuccess = onSuccess;
        this.onFail = onFail;
        this.onVote = onVote;
        this.onUnVote = onUnVote;
        this.goal = 0;
        this.voting = false;
        this.timer = null;
        this.votes = new Map();
        this.onSuccess = onSuccess;
        this.onFail = onFail;
        this.onVote = onVote;
        this.onUnVote = onUnVote;
    }
    ;
    VoteManager.prototype.start = function (player, value, voteTime, threshold) {
        var _this = this;
        this.goal = threshold;
        this.voting = true;
        this.timer = Timer.schedule(function () { return _this.end(); }, voteTime / 1000);
        this.vote(player, value);
    };
    VoteManager.prototype.end = function () {
        if (!this.checkVote()) {
            this.failed();
        }
    };
    VoteManager.prototype.vote = function (player, value) {
        if (!this.voting || player == null || player.usid == null)
            return; //no vote is going on
        this.votes.set(player.uuid, value);
        Log.info("Player voted, Name : ".concat(player.name, ",UUID : ").concat(player.uuid));
        this.onVote(player);
        this.checkVote();
    };
    //unused unvote talking a proper fish player, useful If we ever add a unvote command
    VoteManager.prototype.unvoteFish = function (player) {
        if (!this.voting || player == null || player.uuid == null)
            return;
        if (!this.votes.delete(player.uuid))
            Log.err("Failed to Unvote Player uuid:".concat(player.uuid));
        this.onUnVote(player);
        this.checkVote();
    };
    //unvote with a mindustry player, which occurs during a playerleave event.
    //I hate this method with a passion
    VoteManager.prototype.unvoteMindustry = function (player) {
        if (!this.voting || player == null)
            return;
        if (!this.votes.delete(player.uuid()))
            Log.err("Failed to Unvote Player uuid:".concat(player.uuid()));
        this.onUnVote(player);
        this.checkVote();
    };
    VoteManager.prototype.forceVote = function (force) {
        if (!this.voting)
            return;
        if (force)
            this.succeeded();
        else
            this.failed();
    };
    VoteManager.prototype.failed = function () {
        this.resetVote();
        this.onFail();
    };
    VoteManager.prototype.succeeded = function () {
        this.resetVote();
        this.onSuccess();
    };
    VoteManager.prototype.resetVote = function () {
        if (this.timer !== null)
            this.timer.cancel();
        this.votes.clear();
        this.voting = false;
    };
    VoteManager.prototype.getGoal = function () {
        if (Groups.player.size() >= this.goal) {
            return (this.goal);
        }
        return (Groups.player.size());
    };
    VoteManager.prototype.scoreVotes = function () {
        var scoredVote = 0;
        this.votes.forEach(function (vote) { return (scoredVote += vote); });
        return scoredVote;
    };
    VoteManager.prototype.checkVote = function () {
        if (this.scoreVotes() >= this.getGoal()) {
            this.succeeded();
            return true;
        }
        return false;
    };
    return VoteManager;
}());
exports.VoteManager = VoteManager;
