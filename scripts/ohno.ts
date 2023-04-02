import { FishPlayer } from "./players";
import { nearbyEnemyTile } from "./utils";

export const Ohnos = {
	enabled: true,
	ohnos: new Array<Unit>(),
	makeOhno(team:Team, x:number, y:number){
		const ohno = UnitTypes.atrax.spawn(team, x, y);
		ohno.type = UnitTypes.alpha;
		ohno.apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
		ohno.resetController(); //does this work?
		this.ohnos.push(ohno);
		return ohno;
	},
	canSpawn(player:FishPlayer):true | string {
		if(!this.enabled) return `Ohnos have been temporarily disabled.`;
		if(this.ohnos.length >= (Groups.player.size() + 1)) return `Sorry, the max number of ohno units has been reached.`;
		if(nearbyEnemyTile(player.unit(), 6) != null) return `Too close to an enemy tile!`;
		return true;
	},
	killAll(){
		this.ohnos.forEach(ohno => ohno?.kill?.());
	},
	amount(){
		return this.ohnos.length;
	}
};