import { mapRepoURLs, Mode } from "./config";
import { Promise } from "./promise.js";
import { crash } from "./utils.js";




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

//if we switch to a self-hosted setup, just make it respond with the githubfile object for a drop-in replacement
function fetchGithubContents(){
	return new Promise<GitHubFile[], string>((resolve, reject) => {
		const url = mapRepoURLs[Mode.name()];
		if(!url) return reject(`no recognized gamemode detected. please enter "host <map> <gamemode>" and try again`);
		Log.info(`Requesting github repository contents at ${url}.`);
		Http.get(url, (res) => {
			try {
				//Trust github to return valid JSON data
				resolve(JSON.parse(res.getResultAsString()));
			} catch(e){
				reject(`Failed to parse GitHub repository contents: ${e}`);
			}
		}, () => reject(`Network error while fetching github repository contents`));
	});
}

//clean? no. functional? yeah.
function getFile(address:string, filename:string):Promise<void, string> {
	if(!/^https?:\/\//i.test(address)){
		crash(`Invalid address, please start with 'http://' or 'https://'`);
	}

	return new Promise((resolve, reject) => {
		let instream:InputStream | null = null;
		let outstream:OutputStream | null = null;
		Log.info(`Downloading ${filename}...`);
		Http.get(address, (res) => {
			try {
				instream = res.getResultAsStream();
				outstream = Vars.customMapDirectory.child(filename).write();
				instream.transferTo(outstream);
				resolve();
			} finally {
				instream?.close();
				outstream?.close();
			}
		}, 
		() => {
			Log.err(`Download failed.`);
			reject(`Network error while o`);
		});
	});
}


function sequentialMapDownload(githubListing:GitHubFile[], index:number):Promise<void, string> {
	if(index >= githubListing.length){
		Log.info(`All maps downloaded.`);
		return Promise.resolve(null! as void);
	}
	let fileEntry = githubListing[index];
	if(!fileEntry.download_url){
		Log.warn(`Map ${fileEntry.name} has no valid download link, skipped.`);
		return sequentialMapDownload(githubListing, index + 1);
	}
	return getFile(fileEntry.download_url, Vars.customMapDirectory.child(fileEntry.name).name())
		.then(() => sequentialMapDownload(githubListing, index + 1));
}

export function updateMaps():Promise<void, string> {
	//get github map listing
	return fetchGithubContents().then((listing) => {
		//filter only valid mindustry maps
		const mapList = listing
			.filter(entry => entry.type == 'file')
			.filter(entry => /\.msav$/.test(entry.name));

		const mapFiles:Fi[] = Vars.customMapDirectory.list();
		const removedMaps = mapFiles.filter(localFile =>
			!mapList.some(remoteFile =>
				remoteFile.name === localFile.name()
			)
		);
		removedMaps.forEach((map) => {
			Log.info(`Deleting map ${map.name()}`);
			map.delete();
		});

		let newMaps = mapList
			.filter(entry => {
				const file = Vars.customMapDirectory.child(entry.name);
				return !(file.exists() && file.length() > 0);
			});

		
		if(newMaps.length == 0){
			Log.info(`No map updates found.`);
			return;
		}
		return sequentialMapDownload(newMaps, 0).then(() => {
			Log.info(`Downloads complete, registering maps.`);
			Vars.maps.reload();
		});
	});
}