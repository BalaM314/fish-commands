/**
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the code for automated map syncing.
Original contributor: @author Jurorno9
Maintenance: @author BalaM314
*/

import { mapRepoURLs, Mode } from "./config";
import { Promise } from "./promise";
import { crash, getHash } from "./utils";




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
		if(!url) return reject(`No recognized gamemode detected. please enter "host <map> <gamemode>" and try again`);
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

function downloadFile(address:string, filename:string):Promise<void, string> {
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
				outstream = new Fi(filename).write();
				instream.transferTo(outstream);
				resolve();
			} finally {
				instream?.close();
				outstream?.close();
			}
		}, 
		() => {
			Log.err(`Download failed.`);
			reject(`Network error while downloading a map file: ${address}`);
		});
	});
}


function downloadMaps(githubListing:GitHubFile[]):Promise<void, string> {
	return Promise.all<void[], string>(githubListing.map(fileEntry => {
		if(!(typeof fileEntry.download_url == "string")){
			Log.warn(`Map ${fileEntry.name} has no valid download link, skipped.`);
			return Promise.resolve(null! as void);
		}
		return downloadFile(fileEntry.download_url, Vars.customMapDirectory.child(fileEntry.name).absolutePath());
	})).then(v => {});
}

/**
 * @returns whether any maps were changed
 */
export function updateMaps():Promise<boolean, string> {
	//get github map listing
	return fetchGithubContents().then((listing) => {
		//filter only valid mindustry maps
		const mapList = listing
			.filter(entry => entry.type == 'file')
			.filter(entry => /\.msav$/.test(entry.name));

		const mapFiles:Fi[] = Vars.customMapDirectory.list();
		const mapsToDelete = mapFiles.filter(localFile =>
			!mapList.some(remoteFile =>
				remoteFile.name === localFile.name()
			)
			&& !localFile.name().startsWith("$$")
		);
		mapsToDelete.forEach((map) => map.delete());

		const mapsToDownload = mapList
			.filter(entry => {
				const file = Vars.customMapDirectory.child(entry.name);
				return !file.exists() || entry.sha !== getHash(file); //sha'd
			});
		
		if(mapsToDownload.length == 0){
			return mapsToDelete.length > 0 ? true : false;
		}
		return downloadMaps(mapsToDownload).then(() => {
			Vars.maps.reload();
			return true;
		});
	});
}