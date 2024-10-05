import type { SelectEnumClassKeys } from "./types";

export class Rank {
	static ranks:Record<string, Rank> = {};
	static autoRanks: Rank[] = [];

	static player = new Rank("player", 0, "Ordinary players.", "", "&lk[p]&fr", "");
	static active = new Rank("active", 1, "Assigned automatically to players who have played for some time.", "[black]<[#E67E22]\uE800[]>[]", "&g[P]&fr", "[forest]", {
		joins: 25, playtime: 3600_000, blocksPlaced: 2000
	});
	static trusted = new Rank("trusted", 2, "Trusted players who have gained the trust of a mod or admin.", "[black]<[#E67E22]\uE813[]>[]", "&y[T]&fr", "[#E67E22]");
	static mod = new Rank("mod", 3, "Moderators who can mute, stop, and kick players.", "[black]<[#6FFC7C]\uE817[]>[]", "&lg[M]&fr", "[#6FFC7C]");
	static admin = new Rank("admin", 4, "Administrators with the power to ban players.", "[black]<[#C30202]\uE82C[]>[]", "&lr[A]&fr", "[#C30202]");
	static manager = new Rank("manager", 10, "Managers have file and console access.", "[black]<[scarlet]\uE88E[]>[]", "&c[E]&fr", "[scarlet]");
	static pi = new Rank("pi", 11, "3.14159265358979323846264338327950288419716 (manager)", "[black]<[#FF8000]\u03C0[]>[]", "&b[+]&fr", "[blue]");//i want pi rank
	static fish = new Rank("fish", 999, "Owner.", "[blue]>|||>[] ", "&b[F]&fr", "[blue]");

	autoRankData?: {
		joins: number;
		playtime: number;
		blocksPlaced: number;
	}

	constructor(
		public name:string,
		/** Used to determine whether a rank outranks another. */ public level:number,
		public description:string,
		public prefix:string,
		public shortPrefix:string,
		public color:string,
		autoRankData?: {
			joins?: number;
			playtime?: number;
			blocksPlaced?: number;
		}
	){
		Rank.ranks[name] = this;
		if(autoRankData){
			this.autoRankData = {
				joins: autoRankData.joins ?? 0,
				playtime: autoRankData.playtime ?? 0,
				blocksPlaced: autoRankData.blocksPlaced ?? 0,
			};
			Rank.autoRanks.push(this);
		}
	}
	static getByName(name:string):Rank | null {
		return Rank.ranks[name] ?? null;
	}
	static getByInput(input:string):Rank[] {
		return Object.values(Rank.ranks).filter(rank => rank.name.toLowerCase().includes(input.toLowerCase()));
	}
	coloredName(){
		return this.color + this.name + "[]";
	}
}
Object.freeze(Rank.pi);
export type RankName = SelectEnumClassKeys<typeof Rank>;

export class RoleFlag {
	static flags:Record<string, RoleFlag> = {};
	static developer = new RoleFlag("developer", "[black]<[#B000FF]\uE80E[]>[]", "Awarded to people who contribute to the server's codebase.", "[#B000FF]", true, false);
	static member = new RoleFlag("member", "[black]<[yellow]\uE809[]>[]", "Awarded to our awesome donors who support the server.", "[pink]", true, false);
	static illusionist = new RoleFlag("illusionist", "", "Assigned to to individuals who have earned access to enhanced visual effect features.","[lightgrey]", true, true)
	static chief_map_analyst = new RoleFlag("chief map analyst", "[black]<[#5800FF]\uE833[]>[]", "Assigned to the chief map analyst, who oversees map management.","[#5800FF]", true, true)
	constructor(
		public name:string,
		public prefix:string,
		public description:string,
		public color:string,
		public peristent:boolean = true,
		public assignableByModerators = true,
	){RoleFlag.flags[name] = this;}
	static getByName(name:string):RoleFlag | null {
		return RoleFlag.flags[name] ?? null;
	}
	static getByInput(input:string):RoleFlag[] {
		return Object.values(RoleFlag.flags).filter(flag => flag.name.toLowerCase().includes(input.toLowerCase()));
	}
	coloredName(){
		return this.color + this.name + "[]";
	}
}
export type RoleFlagName = SelectEnumClassKeys<typeof RoleFlag>;
