
export class Rank {
	static ranks:Record<string, Rank> = {};
	
	static new = new Rank("new", -1, "", "[forest]");
	static player = new Rank("player", 0, "", "");
	static trusted = new Rank("trusted", 2, "[black]<[blue]\uE84D[black]>", "[yellow]");
	//icons and names subject to change
	static mod = new Rank("mod", 3, "[black]<[green]M[black]>", "[acid]");
	static admin = new Rank("admin", 4, "[black]<[scarlet]A[black]>", "[cyan]");
	static developer = new Rank("developer", 5, "[black]<[orange]\uE80F[black]>", "[blue]");//i want wrench rank
	static manager = new Rank("manager", 6, "[black]<[scarlet]\uE82C[black]>", "[scarlet]");
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