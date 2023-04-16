
export class Rank {
	static ranks:Record<string, Rank> = {};
	
	static new = new Rank("new", -1, "", "[forest]");
	static player = new Rank("player", 0, "", "");
	static trusted = new Rank("trusted", 2, "[black]<[#E67E22]\uE813[]>[]", "[#E67E22]");
	//icons and names subject to change
	static mod = new Rank("mod", 3, "[black]<[#6FFC7C]\uE817[]>[]", "[#6FFC7C]");
	static admin = new Rank("admin", 4, "[black]<[#C30202]\uE82C[]>[]", "[#C30202]");
	static developer = new Rank("developer", 5, "[black]<[#B000FF]\uE80E[]>[]", "[#B000FF]");
	static pi = new Rank("pi", 9, "[black]<[#FF8000]\u03C0[]>[]", "[blue]");//i want rank
	static manager = new Rank("manager", 10, "[black]<[scarlet]\uE88E[]>[]", "[scarlet]");
	static fish = new Rank("fish", 999, "[blue]>|||>[] ", "[blue]");//Might want to change this to like owner or something
	constructor(
		public name:string,
		/** Used to determine whether a rank outranks another. */ public level:number,
		public prefix:string,
		public color:string = "",
	){
		Rank.ranks[name] = this;
	}
	static getByName(name:string):Rank | null{
		return this.ranks[name] ?? null;
	}
}