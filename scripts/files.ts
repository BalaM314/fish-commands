/**
 * Swamps ToDo list
 * - download maps automaticlly - DONE
 * - read json info in /map
 * - write highscores to json
 * - delete map command
 * Swamps Maybe List
 * - allow voting with /map ui
 * - automaticlly timed updates
 */



import { ARCHIVE_FILE_PATH, ATTACK_SUBDIRECTORY, HEXED_SUBDIRECTORY, MAP_SOURCE_DIRECTORY, Mode, PVP_SUBDIRECTORY, SANDBOX_SUBDIRECTORY, SURVIVAL_SUBDIRECTORY } from "./config";

//#region General I/O

export function readfile<T>(filename:string):T{
    let file = Vars.customMapDirectory.child(filename);
    let jsonStr = file.readString();
    return(JSON.parse(jsonStr) as T);
}
export function writefile(filename:string, data:any){
    let file = Vars.customMapDirectory.child(filename);
    let jsonStr = JSON.stringify(data, null, 2);
    file.writeString(jsonStr);

    //use a fi for move and delete
}

export function downloadfile(filename:string, url:string, callback:(success:boolean)=>(void)){
    Log.info(`Downloading ${filename} from ${url}`);
    let file = Vars.customMapDirectory.child(filename);
    Http.get(url, res => {
        try{
            file.writeBytes(res.getResult());
            Log.info(`Download complete ${filename}`);
            callback(true);
         } catch(error){
            Log.err(`Failed to write file ${filename}, ${error}`);
            callback(false);
        }
    }, () => {
        Log.err(`Failed to download file ${filename}`);
        callback(false);
    });
    
}

//#endregion
//#region Map JSON Managment

interface mapJSON {
    name: string;
    author: string;
    version: number;
    description: string;
    recommendedPlayers: string;
    scoreMode: string;
    score: number;
}

export function getMapData(map:MMap):mapJSON | null{
    try{
        return readfile<mapJSON>(map.file.nameWithoutExtention() + '.json')
    }catch(error){
        Log.err(`unable to fetch map data, ${error}.`)
        return null;
    }
}
export function saveMapData(map:MMap, mapData:mapJSON){
    writefile(map.file.nameWithoutExtention() + '.json', mapData);
}

function archive(file:string){
    const archives = Vars.customMapDirectory.child("archived");
    if(!archives.exists()){
        Log.info(`Generating /archives directory`);
        try{
        archives.mkdirs();
        }catch(error){
            Log.err(`Failed to generate /archives, abort.`)
            return;
        }
    }
    try{
        const destination = archives.child(file)
        const source = Vars.customMapDirectory.child(file)
        source.moveTo(destination);
        source.delete();
    }catch(error){
        Log.err(`Failed to archive file ${file}, ${error}`);
    }

}
function rollback(file:string){
    const archives = Vars.customMapDirectory.child(ARCHIVE_FILE_PATH);
    if(!archives.exists()){
        Log.err(`Cannot find archive directory ${file}.`)
    }
    try {
        const destination = Vars.customMapDirectory.child(file);
        const source = archives.child(file);
        source.moveTo(destination);
    } catch (error) {
        Log.err(`Failed to rollback file ${file}, ${error}`)
    }
}
function deleteMap(map:MMap){
    const filename = map.file.nameWithoutExtention();
    if(Vars.customMapDirectory.child(filename + '.json').delete() && Vars.customMapDirectory.child(filename + '.msav').delete()){
        Log.info(`Deleted active copy of ${filename}.`);
        if(Vars.customMapDirectory.child(ARCHIVE_FILE_PATH).exists()){
            if(Vars.customMapDirectory.child(ARCHIVE_FILE_PATH).child(filename + '.json').exists()) Vars.customMapDirectory.child(ARCHIVE_FILE_PATH).child(filename + '.json').delete();
            if(Vars.customMapDirectory.child(ARCHIVE_FILE_PATH).child(filename + '.msav').exists()) Vars.customMapDirectory.child(ARCHIVE_FILE_PATH).child(filename + '.msav').delete();
            Log.info(`deleted archive copy of ${filename}.`)

        }else{
            Log.warn(`no archive directory found.`);
        }
    }else{
        Log.err(`Failed to delete ${filename}, attempting rollback...`);
        rollback(filename + '.json');
        rollback(filename + '.msav');
    }
    
}
//#endregion
//#region Auto-Update
interface GitHubFile {
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
//very cursed
function mapSubdiretory():string{
    if(Mode.attack()){
        return ATTACK_SUBDIRECTORY;
    }
    if(Mode.survival()){
        return SURVIVAL_SUBDIRECTORY;
    }
    if(Mode.pvp()){
        return PVP_SUBDIRECTORY;
    }
    if(Mode.hexed()){
        return HEXED_SUBDIRECTORY;
    }
    if(Mode.sandbox()){
        return SANDBOX_SUBDIRECTORY;
    }
    return "";
}

//slightly cursed
function updatemap(file:GitHubFile){
    if(!/\.json$/i.test(file.name) || !file.download_url){
        Log.err(`${file.name} is not a valid map json file`)
        return;
    }
    let oldMapData:mapJSON = readfile<mapJSON>(file.name);
    archive(file.name);
    downloadfile(file.name,file.download_url,(success)=> {
        if(!success){
            Log.err(`Download ${file.name} failed, attempting rollback.`)
            rollback(file.name);
            return;
        }
        let mapName = file.name.split('.').slice(0, -1).join('.') + '.msav'
        let newMapData:mapJSON = readfile<mapJSON>(file.name);
        if(newMapData.version == oldMapData.version || !file.download_url){
            Log.info(`Map ${mapName} is up to date`);
            return;
        }
        Log.info(`Downloading map update for ${mapName} ...`)
        //hidious line that just alters the json download to a .msav download
        downloadfile(mapName,file.download_url.substring(0, file.download_url.lastIndexOf('.')) + '.msav', (success)=> {
            if(!success){
                Log.err(`Failed to download map update, attempting rollback...`);
                rollback(mapName);
                return;
            }
            Log.info(`Map Updated ${mapName}...`);
        });
    });
}
//slightly less cursed
export function updatemaps(){
    if(!mapSubdiretory()){
        Log.err(`Cannot find map directory for gamemode.`);
    }
    Log.info(`Update repository : ${MAP_SOURCE_DIRECTORY+mapSubdiretory()}`)
    Log.info(`fetching map list ...`)
    Http.get(MAP_SOURCE_DIRECTORY + mapSubdiretory(), (res) => {
        let responce:string = res.getResultAsString();
        let listing:GitHubFile[] = JSON.parse(responce) as GitHubFile[];
        let jsonListing = listing.filter(file => /\.json$/i.test(file.name));

        jsonListing.forEach((file) => {
            updatemap(file);
        })
        try {
            Vars.maps.reload();
        } catch (error) {
            Log.err(`failed to register maps`);
        }
    }, () => {
        Log.err(`failed to fetch map list`);
    })
    return;
}
//#endregion