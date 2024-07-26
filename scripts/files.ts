import { attackMapURL, hexedMapURL, Mode, pvpMapURL, sandboxMapURL, survivalMapURL } from "./config";




type GitHubFile = {
	name: string;
	path: string;
	sha: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	download_url: string | null;
	type: 'file' | 'dir';
}

function getURLfromGamemode():string | null{
	if(Mode.attack()){
		return(attackMapURL);
	}
	if(Mode.survival()){
		return(survivalMapURL);
	}
	if(Mode.pvp()){
		return(pvpMapURL);
	}
	if(Mode.sandbox()){
		return(sandboxMapURL);
	}
	if(Mode.hexed()){
		return(hexedMapURL);
	}
	return null;
}

//if we switch to a self-hosted setup, just make it respond with the githubfile object for a drop-in replacement
function fetchGithubContents(callback:(listing:GitHubFile[] | null) => (void)):void{
	let url = getURLfromGamemode();
	if(!url){ 
		Log.err(`no recognized gamemode detected. please enter "host <map> <gamemode>" and try again`);
		callback(null);
		return;
	}
	Log.info(`Requesting github repository contents at ${url}.`)
	Http.get(url, (res:HttpResponse) => {
		try {
			let jsonStr = res.getResultAsString();
			const parsed = JSON.parse(jsonStr) as GitHubFile[];
			Log.info(`Request success, checking maps`)
			callback(parsed);
		} catch (e){
			Log.err(`Failed to parse GitHub repository contents: ${e}`);
			callback(null);
		}
	}, () =>{
		Log.err(`Failed to fetch github repository contents`)
		callback(null);
		return;
	})

}

//clean? no. functional? yeah.
function getFile(address:string, callback:(success:boolean) => (void), filename:string){
	if(!/^https?:\/\//i.test(address)){
		Log.err(`Invalid address, please start with 'http://' or 'https://'`);
		callback(false);
		return;
	}

	let instream: InputStream | null = null;
	let outstream: OutputStream | null = null;
	Log.info(`Downloading ${filename} from ${address}`)
	Http.get(address, (res) => {
		instream = res.getResultAsStream();
		outstream = Vars.customMapDirectory.child(filename).write();
		instream.transferTo(outstream);
		instream.close();
		outstream.close();
		callback(true);
		return;
	}, 
	() => {
		if(instream) instream.close();
		if(outstream) outstream.close();
		Log.err(`Download failed.`);
		callback(false);
		return;
	});
}


function sequentialMapDownload(githubListing:GitHubFile[], index:number, callback:() => void){
	if(index >= githubListing.length){
		Log.info(`All maps downloaded.`);
		callback();
		return;
	}
	let fileEntry = githubListing[index];
	if(!fileEntry.download_url){
		Log.warn(`Map ${fileEntry.name} has no valid download link, skipped.`)
		sequentialMapDownload(githubListing, index + 1, callback);
		return;
	}
	getFile(fileEntry.download_url, () => {
		sequentialMapDownload(githubListing, index + 1, callback)
	}, Vars.customMapDirectory.child(fileEntry.name).name());
}

export function updateMaps(callback:(success:boolean) => (void)):void{
	//get github map listing
	fetchGithubContents((listing) => {
		if(listing == null){
			callback(false);
			return;
		}
		//filter only valid mindustry maps
		let mapList = listing
			.filter(entry => entry.type == 'file')
			.filter(entry => /\.msav$/.test(entry.name))

		//delete unfound maps
		let mapFiles:Fi[] = Vars.customMapDirectory.list();
		let unfoundMaps = mapFiles.filter(function(localFile) {
			return !mapList.some(function(onlineFile) {
				return onlineFile.name === localFile.name();
			});
		});
		unfoundMaps.forEach( (map) => {
			Log.info(`Deleting map ${map.name()} - Not found in github repository.`);
			map.delete();
		});

		//eliminate up to date maps
		let outDatedMapsList = mapList
			.filter(entry => !(Vars.customMapDirectory.child(entry.name).exists() && Vars.customMapDirectory.child(entry.name).length() > 0));

		
		if(outDatedMapsList.length == 0){
			Log.info(`No map updates found.`);
			callback(true);
			return;
		 } else {
			
			sequentialMapDownload(outDatedMapsList, 0, () => {
				Log.info(`Downloads complete, registering maps.`);
				try {
					Vars.maps.reload;
					Log.info(`Map update complete`);
					callback(true);
					return;
				} catch (e){
					Log.info(`failed to register 1 or more maps, ${e}`); 
					callback(false);
					return;
				}
			});
		}
	});
}