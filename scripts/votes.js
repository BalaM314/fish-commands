"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteManager = void 0;
var VoteManager = /** @class */ (function () {
    function VoteManager(onSuccess, // implementation handle vote success
    onFail, // implementation handle vote fail
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
        if (!this.voting)
            return; //no vote is going on
        this.votes.set(player, value);
        this.onVote(player);
        this.checkVote();
    };
    VoteManager.prototype.unvote = function (player) {
        if (!this.voting)
            return; // still no vote
        this.votes.delete(player);
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
