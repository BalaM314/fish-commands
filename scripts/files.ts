/**
 * Swamps Todo list
 * - Highscore storage
 * - Vote with /map
 * - Test this implementation with all fish maps
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
    scoreMode: 'Wave'| 'Time'| 'None';
    score: number;
}

export function getMapData(map:MMap):mapJSON | null{
    try{
        return readfile<mapJSON>(map.file.nameWithoutExtension() + '.json')
    }catch(error){
        Log.err(`Unable to fetch map data, ${error}.`)
        return null;
    }
}
export function saveMapData(map:MMap, mapData:mapJSON){
    writefile(map.file.nameWithoutExtension() + '.json', mapData);
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
export function deleteMap(map:MMap){
    const filename = map.file.nameWithoutExtension();
    if(Vars.customMapDirectory.child(filename + '.json').delete() && Vars.customMapDirectory.child(filename + '.msav').delete()){
        Log.info(`Deleted active copy of ${filename}.`);
        if(Vars.customMapDirectory.child(ARCHIVE_FILE_PATH).exists()){
            if(Vars.customMapDirectory.child(ARCHIVE_FILE_PATH).child(filename + '.json').exists()) Vars.customMapDirectory.child(ARCHIVE_FILE_PATH).child(filename + '.json').delete();
            if(Vars.customMapDirectory.child(ARCHIVE_FILE_PATH).child(filename + '.msav').exists()) Vars.customMapDirectory.child(ARCHIVE_FILE_PATH).child(filename + '.msav').delete();
            Log.info(`Deleted archive copy of ${filename}.`)

        }else{
            Log.warn(`No archive directory found.`);
        }
    }else{
        Log.err(`Failed to delete ${filename}, attempting rollback`);
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
function mapSubDir():string | null{
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
    return null;
}

//recursive to avoid async hell 
function mapUpdater(jsonListings: GitHubFile[], index: number, callback: () => void) {
    if (index >= jsonListings.length) {
        callback();
        return;
    } else {
        updatemap(jsonListings[index], (success) => {
            mapUpdater(jsonListings, index + 1, callback);
        });
    }
}

//slightly cursed
function updatemap(file:GitHubFile, callback:(success:boolean) => (void)){
    if(file.name == "example.json"){
        callback(true);
        return; //ignore example.json
    }
    if(!/\.json$/i.test(file.name) || !file.download_url){
        Log.err(`${file.name} is not a valid map json file`)
        callback(true);
        return;
    }
    let oldMapData:mapJSON | null = null;
    if(Vars.customMapDirectory.child(file.name).exists()){
        oldMapData = readfile<mapJSON>(file.name);
        archive(file.name);
    }
    downloadfile(file.name,file.download_url,(success)=> {
        if(!success){
            Log.err(`Download ${file.name} failed, attempting rollback.`)
            rollback(file.name);
            callback(false);
            return;
        }
        let mapName = file.name.split('.').slice(0, -1).join('.') + '.msav'
        let newMapData:mapJSON = readfile<mapJSON>(file.name);
        //save persistant data between updates
        if(oldMapData){
            newMapData.score = oldMapData.score;
            writefile(file.name, newMapData);
        }
        if(oldMapData && newMapData.version == oldMapData.version && oldMapData.version != 0){
            Log.info(`Map ${mapName} is up to date`);
            callback(true);
            return;
        }
        if(!file.download_url){
            Log.err(`Map ${mapName} download url not found`);
            callback(false);
            return;
        }
        Log.info(`Downloading map update for ${mapName}`)
        //hidious line that just alters the json download to a .msav download
        downloadfile(mapName,file.download_url.substring(0, file.download_url.lastIndexOf('.')) + '.msav', (success)=> {
            if(!success){
                Log.err(`Failed to download map update, attempting rollback`);
                newMapData.version = 0;//
                writefile(file.name, newMapData);
                rollback(mapName);
                callback(false);
                return;
            }
            Log.info(`Map Updated ${mapName}`);
            callback(true);
            return;
        });
    });
}
//slightly less cursed
export function updatemaps(){
    Call.sendMessage(`[orange]Automated map updating has started.`);
    if(!mapSubDir()){
        Log.err(`Cannot find map directory for gamemode.`);
    }
    Log.info(`Update repository : ${MAP_SOURCE_DIRECTORY}${mapSubDir()}`)
    Log.info(`fetching map list`)
    Http.get(MAP_SOURCE_DIRECTORY + mapSubDir(), (res) => {
    //Http.get("https://api.github.com/repositories/831037490/contents/survival", (res) => {
        let responce:string = res.getResultAsString();
        let listing:GitHubFile[] = JSON.parse(responce) as GitHubFile[];
        let jsonListing = listing.filter(file => /\.json$/i.test(file.name));
        mapUpdater(jsonListing,0, () => {
            Log.info(`Map downloading complete`)
        try{
            Vars.maps.reload();
            Log.info(`Map updating complete`);
            Call.sendMessage(`[orange]Automatic map updates completed`);
        }catch(error){
            Log.err(`Failed to register 1 or more maps, \n ${error}`);
        }
        });
    }, () => {
        Log.err(`failed to fetch map list`);
    })
    return;
}
//#endregion
//#region Save Map Highscores
Events.on(EventType.GameOverEvent, () => {
    let mdata = getMapData(Vars.state.map);
    if(!mdata) return;
    switch(mdata.scoreMode){
        case "Wave":
            let newScore = Vars.state.wave;
            if(newScore > mdata.score) mdata.score = newScore;
            saveMapData(Vars.state.map, mdata);
            break;
        case "Time":
            mdata.score = Vars.state.map.getHightScore()
            saveMapData(Vars.state.map, mdata);
            break;
        default:
            break;
    }
});
//#endregion