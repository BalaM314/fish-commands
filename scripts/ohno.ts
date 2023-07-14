import { FishPlayer } from "./players";
import { nearbyEnemyTile } from "./utils";

export const Ohnos = {
	enabled: true,
	ohnos: new Array<Unit>(),
	lastSpawned: 0,
	makeOhno(team:Team, x:number, y:number){
		const ohno = UnitTypes.atrax.spawn(team, x, y);
		ohno.type = UnitTypes.alpha;
		ohno.apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
		ohno.resetController(); //does this work?
		this.ohnos.push(ohno);
		this.lastSpawned = Date.now();
		return ohno;
	},
	canSpawn(player:FishPlayer):true | string {
		if(!this.enabled) return `Ohnos have been temporarily disabled.`;
		if(!player.connected() || !player.unit().added || player.unit().dead) return `You cannot spawn ohnos while dead.`
		this.updateLength();
		if(this.ohnos.length >= (Groups.player.size() + 1)) return `Sorry, the max number of ohno units has been reached.`;
		if(nearbyEnemyTile(player.unit(), 6) != null) return `Too close to an enemy tile!`;
		// if(Date.now() - this.lastSpawned < 3000) return `This command is currently on cooldown.`;
		return true;
	},
	updateLength(){
		this.ohnos = this.ohnos.filter(o => o && o.isAdded() && !o.dead);
	},
	killAll(){
		this.ohnos.forEach(ohno => ohno?.kill?.());
		this.ohnos = [];
	},
	amount(){
		return this.ohnos.length;
	},
	onGameOver(){
		this.killAll();
	}
};
