import { SelectClasslikeEnumKeys as SelectEnumClassKeys } from "./types";

export class Rank {
	static ranks:Record<string, Rank> = {};
	
	static new = new Rank("new", -1, "For new players.", "", "[forest]");
	static player = new Rank("player", 0, "Ordinary players.", "");
	static trusted = new Rank("trusted", 2, "Trusted players who have gained the trust of a mod or admin.", "[black]<[#E67E22]\uE813[]>[]", "[#E67E22]");
	//icons and names subject to change
	static mod = new Rank("mod", 3, "Moderators who can mute, stop, and kick players.", "[black]<[#6FFC7C]\uE817[]>[]", "[#6FFC7C]");
	static admin = new Rank("admin", 4, "Administrators with the power to ban players.", "[black]<[#C30202]\uE82C[]>[]", "[#C30202]");
	static manager = new Rank("manager", 10, "Managers have file and console access.", "[black]<[scarlet]\uE88E[]>[]", "[scarlet]");
	static pi = new Rank("pi", 11, "3.14159265358979323846264338327950288419716", "[black]<[#FF8000]\u03C0[]>[]", "[blue]");//i want pi rank
	static fish = new Rank("fish", 999, "Owner.", "[blue]>|||>[] ", "[blue]");//Might want to change this to like owner or something
	constructor(
		public name:string,
		/** Used to determine whether a rank outranks another. */ public level:number,
		public description:string,
		public prefix:string,
		public color:string = "",
	){
		Rank.ranks[name] = this;
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
export type RankName = SelectEnumClassKeys<typeof Rank>;

export class RoleFlag {
	static flags:Record<string, RoleFlag> = {};
	static developer = new RoleFlag("developer", "[black]<[#B000FF]\uE80E[]>[]", "Awarded to people who contribute to the server's codebase.", "[#B000FF]", true, false);
	static member = new RoleFlag("member", "[black]<[yellow]\uE809[]>[]", "Awarded to our awesome donors who support the server.", "[pink]", true, false);
	//static afk = new RoleFlag("afk", "[orange]\uE876 AFK \uE876 | [white]", "Used for players who are idle for longer than 2 minutes.", "[orange]", false);
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
