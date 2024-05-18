"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteManager = void 0;
/**
 * manages a threshold based voting instance. mimics a votekick-style voting system
 */
var VoteManager = /** @class */ (function () {
    function VoteManager(onSuccess, // implementation handle vote success
    onFail) {
        this.onSuccess = onSuccess;
        this.onFail = onFail;
        this.goal = 5;
        this.voting = false;
        this.timer = null;
        this.votes = new Map();
        this.onSuccess = onSuccess;
        this.onFail = onFail;
    }
    ;
    //public triggers
    //start the vote
    VoteManager.prototype.start = function (player, value, voteTime) {
        this.voting = true;
        this.timer = Timer.schedule(this.end, voteTime / 1000);
        this.vote(player, value);
    };
    //end the vote
    VoteManager.prototype.end = function () {
        if (!this.checkVote()) {
            this.failed();
        }
    };
    //add or change a vote
    VoteManager.prototype.vote = function (player, value) {
        if (!this.voting)
            return; //no vote is going on
        this.votes.set(player, value);
        this.checkVote();
    };
    //unvote, for players leaving
    VoteManager.prototype.unvote = function (player) {
        if (!this.voting)
            return; // still no vote
        this.votes.delete(player);
        this.checkVote();
    };
    //force a vote outcome
    VoteManager.prototype.forceVote = function (force) {
        if (!this.voting)
            return;
        if (force)
            this.succeeded();
        else
            this.failed();
    };
    //private handlers
    //reset manager when vote fail
    VoteManager.prototype.failed = function () {
        this.resetVote();
        this.onFail();
    };
    //resets manager when the vote passes
    VoteManager.prototype.succeeded = function () {
        this.resetVote();
        this.onSuccess();
    };
    //reset timer / maps
    VoteManager.prototype.resetVote = function () {
        this.timer.cancel();
        this.votes.clear();
        this.voting = false;
    };
    //voting utilities
    //get threshold for votes
    VoteManager.prototype.getGoal = function () {
        if (Groups.player.size() >= this.goal) {
            return (this.goal);
        }
        return (Groups.player.size());
    };
    //score out the votes
    VoteManager.prototype.scoreVotes = function () {
        var scoredVote = 0;
        this.votes.forEach(function (vote) { return (scoredVote += vote); });
        return scoredVote;
    };
    //checks if vote passed
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
//I removed votekickmanager, because it seems to be unused
