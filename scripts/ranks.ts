
export class Rank {
	static player = new Rank("player", 0, "");
	static active = new Rank("active", 1, "[black]<[green]\uE800[black]>");
	static trusted = new Rank("trusted", 2, "[black]<[blue]\uE84D[black]>");
	//icons and names subject to change
	static mod = new Rank("mod", 3, "[black]<[green]M[black]>");
	static admin = new Rank("admin", 4, "[black]<[scarlet]A[black]>");
	static developer = new Rank("developer", 5, "[black]<[yellow]\uE80F[black]>");//i want wrench rank
	static manager = new Rank("manager", 6, "[black]<[scarlet]\uE82C[black]>");
	static fish = new Rank("fish", 999, "[blue]>|||>[] ");//Might want to change this to like owner or something
	static ranks:Record<string, Rank> = {};
	constructor(
		public name:string,
		/** Used to determine whether a rank outranks another. */ public level:number, 
		public prefix:string
	){
		Rank.ranks[name] = this;
	}
	static getByName(name:string):Rank | null{
		return this.ranks[name] ?? null;
	}
}