"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*//import { FishPlayer } from "./players";

interface VoteSession<Data> {
    
    votes: Record<string, 1 | -1>;
    data: Data;
}

class VoteManager<Data> {
    currentSession:VoteSession<Data> | null = null;
    constructor(
        public onStart: (data:VoteSession<Data>) => unknown,
        public onPass: (data:VoteSession<Data>) => unknown,
        public onFail: (data:VoteSession<Data>) => unknown,
        public getVotesToPass: () => number = () => Math.ceil(Groups.player.size() / 2),
        public allowNoVotes:boolean = true,
        public timeout:number | null = 30,
        public endOnVoteReached:boolean = true,
    ){};
    start(data:Data, player?:FishPlayer){
        this.currentSession = {
            votes: {},
            data
        };
        this.onStart(this.currentSession);
        if(player) this.handleVote(player, 1);
        if(this.timeout)
            Timer.schedule(() => this.end(), this.timeout);
    }
    handleVote(player:FishPlayer, vote:1 | -1){
        if(vote == -1 && !this.allowNoVotes) return; //no votes are not allowed
        if(!this.currentSession) return; //no active vote session
        this.currentSession.votes[player.uuid] = vote;
        //maybe end the votekick
        if(this.endOnVoteReached && this.checkPass()) this.pass();
    }
    end(){
        if(!this.currentSession) return;
        if(this.checkPass()) this.pass()
        else this.fail();
    }
    checkPass():boolean {
        if(!this.currentSession) return false; //no active vote session, error
        const votes = VoteManager.totalVotes(this.currentSession);
        return votes >= this.getVotesToPass();
    }
    pass(){
        if(!this.currentSession) return;
        this.onPass(this.currentSession);
        this.currentSession = null;
    }
    fail(){
        if(!this.currentSession) return;
        this.onFail(this.currentSession);
        this.currentSession = null;
    }
    static totalVotes(session:VoteSession<unknown>){
        return Object.values(session.votes).reduce((acc, a) => acc + a, 0);
    }
}

export const votekickmanager = new VoteManager<{
    initiator:FishPlayer;
    target:FishPlayer;
}>(
    ({data}) => {
        if(!data.initiator.hasPerm("bypassVoteFreeze")){
            data.initiator.freeze(); //TODO freeze
        }
        if(!data.target.hasPerm("bypassVoteFreeze")){
            data.target.freeze();
        }
    },
    ({data}) => {
        data.target.player.kick(Packets.KickReason.vote, 3600 * 1000);
        data.initiator.unfreeze();
    },
    ({data}) => {
        data.target.unfreeze();
        data.initiator.unfreeze();
    },
    undefined, true, 30, false
);

//test
votekickmanager.start({
    initiator: FishPlayer.getByName("BalaM314")!,
    target: FishPlayer.getByName("sussyGreefer")!,
});
votekickmanager.handleVote(FishPlayer.getByName("Fish")!, 1);
// this should end the votekick



*/ 
