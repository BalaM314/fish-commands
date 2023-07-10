"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.votekickmanager = void 0;
var players_1 = require("./players");
var VoteManager = /** @class */ (function () {
    function VoteManager(onStart, onPass, onFail, getVotesToPass, allowNoVotes, timeout, endOnVoteReached) {
        if (getVotesToPass === void 0) { getVotesToPass = function () { return Math.ceil(Groups.player.size() / 2); }; }
        if (allowNoVotes === void 0) { allowNoVotes = true; }
        if (timeout === void 0) { timeout = 30; }
        if (endOnVoteReached === void 0) { endOnVoteReached = true; }
        this.onStart = onStart;
        this.onPass = onPass;
        this.onFail = onFail;
        this.getVotesToPass = getVotesToPass;
        this.allowNoVotes = allowNoVotes;
        this.timeout = timeout;
        this.endOnVoteReached = endOnVoteReached;
        this.currentSession = null;
    }
    ;
    VoteManager.prototype.start = function (data, player) {
        var _this = this;
        this.currentSession = {
            votes: {},
            data: data
        };
        this.onStart(this.currentSession);
        if (player)
            this.handleVote(player, 1);
        if (this.timeout)
            Timer.schedule(function () { return _this.end(); }, this.timeout);
    };
    VoteManager.prototype.handleVote = function (player, vote) {
        if (vote == -1 && !this.allowNoVotes)
            return; //no votes are not allowed
        if (!this.currentSession)
            return; //no active vote session
        this.currentSession.votes[player.uuid] = vote;
        //maybe end the votekick
        if (this.endOnVoteReached && this.checkPass())
            this.pass();
    };
    VoteManager.prototype.end = function () {
        if (!this.currentSession)
            return;
        if (this.checkPass())
            this.pass();
        else
            this.fail();
    };
    VoteManager.prototype.checkPass = function () {
        if (!this.currentSession)
            return false; //no active vote session, error
        var votes = VoteManager.totalVotes(this.currentSession);
        return votes >= this.getVotesToPass();
    };
    VoteManager.prototype.pass = function () {
        if (!this.currentSession)
            return;
        this.onPass(this.currentSession);
        this.currentSession = null;
    };
    VoteManager.prototype.fail = function () {
        if (!this.currentSession)
            return;
        this.onFail(this.currentSession);
        this.currentSession = null;
    };
    VoteManager.totalVotes = function (session) {
        return Object.values(session.votes).reduce(function (acc, a) { return acc + a; }, 0);
    };
    return VoteManager;
}());
exports.votekickmanager = new VoteManager(function (_a) {
    var data = _a.data;
    if (!data.initiator.hasPerm("bypassVoteFreeze")) {
        data.initiator.freeze(); //TODO freeze
    }
    if (!data.target.hasPerm("bypassVoteFreeze")) {
        data.target.freeze();
    }
}, function (_a) {
    var data = _a.data;
    data.target.player.kick(Packets.KickReason.vote, 3600 * 1000);
    data.initiator.unfreeze();
}, function (_a) {
    var data = _a.data;
    data.target.unfreeze();
    data.initiator.unfreeze();
}, undefined, true, 30, false);
//test
exports.votekickmanager.start({
    initiator: players_1.FishPlayer.getByName("BalaM314"),
    target: players_1.FishPlayer.getByName("sussyGreefer"),
});
exports.votekickmanager.handleVote(players_1.FishPlayer.getByName("Fish"), 1);
// this should end the votekick
