"use strict";
/**
 * Swamps Todo list
 * - Highscore storage
 * - Vote with /map
 * - Test this implementation with all fish maps
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatemaps = exports.deleteMap = exports.saveMapData = exports.getMapData = exports.downloadfile = exports.writefile = exports.readfile = void 0;
var config_1 = require("./config");
//#region General I/O
function readfile(filename) {
    var file = Vars.customMapDirectory.child(filename);
    var jsonStr = file.readString();
    return JSON.parse(jsonStr);
}
exports.readfile = readfile;
function writefile(filename, data) {
    var file = Vars.customMapDirectory.child(filename);
    var jsonStr = JSON.stringify(data, null, 2);
    file.writeString(jsonStr);
    //use a fi for move and delete
}
exports.writefile = writefile;
function downloadfile(filename, url, callback) {
    Log.info("Downloading ".concat(filename, " from ").concat(url));
    var file = Vars.customMapDirectory.child(filename);
    Http.get(url, function (res) {
        try {
            file.writeBytes(res.getResult());
            callback(true);
        }
        catch (error) {
            Log.err("Failed to write file ".concat(filename, ", ").concat(error));
            callback(false);
        }
    }, function () {
        Log.err("Failed to download file ".concat(filename));
        callback(false);
    });
}
exports.downloadfile = downloadfile;
function getMapData(map) {
    try {
        return readfile(map.file.nameWithoutExtension() + '.json');
    }
    catch (error) {
        Log.err("Unable to fetch map data, ".concat(error, "."));
        return null;
    }
}
exports.getMapData = getMapData;
function saveMapData(map, mapData) {
    writefile(map.file.nameWithoutExtension() + '.json', mapData);
}
exports.saveMapData = saveMapData;
function archive(file) {
    var archives = Vars.customMapDirectory.child("archived");
    if (!archives.exists()) {
        Log.info("Generating /archives directory");
        try {
            archives.mkdirs();
        }
        catch (error) {
            Log.err("Failed to generate /archives, abort.");
            return;
        }
    }
    try {
        var destination = archives.child(file);
        var source = Vars.customMapDirectory.child(file);
        source.moveTo(destination);
        source.delete();
    }
    catch (error) {
        Log.err("Failed to archive file ".concat(file, ", ").concat(error));
    }
}
function rollback(file) {
    var archives = Vars.customMapDirectory.child(config_1.ARCHIVE_FILE_PATH);
    if (!archives.exists()) {
        Log.err("Cannot find archive directory ".concat(file, "."));
    }
    try {
        var destination = Vars.customMapDirectory.child(file);
        var source = archives.child(file);
        source.moveTo(destination);
    }
    catch (error) {
        Log.err("Failed to rollback file ".concat(file, ", ").concat(error));
    }
}
function deleteMap(map) {
    var filename = map.file.nameWithoutExtension();
    if (Vars.customMapDirectory.child(filename + '.json').delete() && Vars.customMapDirectory.child(filename + '.msav').delete()) {
        Log.info("Deleted active copy of ".concat(filename, "."));
        if (Vars.customMapDirectory.child(config_1.ARCHIVE_FILE_PATH).exists()) {
            if (Vars.customMapDirectory.child(config_1.ARCHIVE_FILE_PATH).child(filename + '.json').exists())
                Vars.customMapDirectory.child(config_1.ARCHIVE_FILE_PATH).child(filename + '.json').delete();
            if (Vars.customMapDirectory.child(config_1.ARCHIVE_FILE_PATH).child(filename + '.msav').exists())
                Vars.customMapDirectory.child(config_1.ARCHIVE_FILE_PATH).child(filename + '.msav').delete();
            Log.info("Deleted archive copy of ".concat(filename, "."));
        }
        else {
            Log.warn("No archive directory found.");
        }
    }
    else {
        Log.err("Failed to delete ".concat(filename, ", attempting rollback"));
        rollback(filename + '.json');
        rollback(filename + '.msav');
    }
}
exports.deleteMap = deleteMap;
//very cursed
function mapSubDir() {
    if (config_1.Mode.attack()) {
        return config_1.ATTACK_SUBDIRECTORY;
    }
    if (config_1.Mode.survival()) {
        return config_1.SURVIVAL_SUBDIRECTORY;
    }
    if (config_1.Mode.pvp()) {
        return config_1.PVP_SUBDIRECTORY;
    }
    if (config_1.Mode.hexed()) {
        return config_1.HEXED_SUBDIRECTORY;
    }
    if (config_1.Mode.sandbox()) {
        return config_1.SANDBOX_SUBDIRECTORY;
    }
    return null;
}
//recursive to avoid async hell 
function mapUpdater(jsonListings, index, callback) {
    if (index >= jsonListings.length) {
        callback();
        return;
    }
    else {
        updatemap(jsonListings[index], function (success) {
            mapUpdater(jsonListings, index + 1, callback);
        });
    }
}
//slightly cursed
function updatemap(file, callback) {
    if (file.name == "example.json") {
        callback(true);
        return; //ignore example.json
    }
    if (!/\.json$/i.test(file.name) || !file.download_url) {
        Log.err("".concat(file.name, " is not a valid map json file"));
        callback(true);
        return;
    }
    var oldMapData = null;
    if (Vars.customMapDirectory.child(file.name).exists()) {
        oldMapData = readfile(file.name);
        archive(file.name);
    }
    downloadfile(file.name, file.download_url, function (success) {
        if (!success) {
            Log.err("Download ".concat(file.name, " failed, attempting rollback."));
            rollback(file.name);
            callback(false);
            return;
        }
        var mapName = file.name.split('.').slice(0, -1).join('.') + '.msav';
        var newMapData = readfile(file.name);
        //save persistant data between updates
        if (oldMapData) {
            newMapData.score = oldMapData.score;
            writefile(file.name, newMapData);
        }
        if (oldMapData && newMapData.version == oldMapData.version && oldMapData.version != 0) {
            Log.info("Map ".concat(mapName, " is up to date"));
            callback(true);
            return;
        }
        if (!file.download_url) {
            Log.err("Map ".concat(mapName, " download url not found"));
            callback(false);
            return;
        }
        Log.info("Downloading map update for ".concat(mapName));
        //hidious line that just alters the json download to a .msav download
        downloadfile(mapName, file.download_url.substring(0, file.download_url.lastIndexOf('.')) + '.msav', function (success) {
            if (!success) {
                Log.err("Failed to download map update, attempting rollback");
                newMapData.version = 0; //
                writefile(file.name, newMapData);
                rollback(mapName);
                callback(false);
                return;
            }
            Log.info("Map Updated ".concat(mapName));
            callback(true);
            return;
        });
    });
}
//slightly less cursed
function updatemaps() {
    Call.sendMessage("[orange]Automated map updating has started.");
    if (!mapSubDir()) {
        Log.err("Cannot find map directory for gamemode.");
    }
    Log.info("Update repository : ".concat(config_1.MAP_SOURCE_DIRECTORY).concat(mapSubDir()));
    Log.info("fetching map list");
    Http.get(config_1.MAP_SOURCE_DIRECTORY + mapSubDir(), function (res) {
        //Http.get("https://api.github.com/repositories/831037490/contents/survival", (res) => {
        var responce = res.getResultAsString();
        var listing = JSON.parse(responce);
        var jsonListing = listing.filter(function (file) { return /\.json$/i.test(file.name); });
        mapUpdater(jsonListing, 0, function () {
            Log.info("Map downloading complete");
            try {
                Vars.maps.reload();
                Log.info("Map updating complete");
                Call.sendMessage("[orange]Automatic map updates completed");
            }
            catch (error) {
                Log.err("Failed to register 1 or more maps, \n ".concat(error));
            }
        });
    }, function () {
        Log.err("failed to fetch map list");
    });
    return;
}
exports.updatemaps = updatemaps;
//#endregion
//#region Save Map Highscores
Events.on(EventType.GameOverEvent, function () {
    var mdata = getMapData(Vars.state.map);
    if (!mdata)
        return;
    switch (mdata.scoreMode) {
        case "Wave":
            var newScore = Vars.state.wave;
            if (newScore > mdata.score)
                mdata.score = newScore;
            saveMapData(Vars.state.map, mdata);
            break;
        case "Time":
            mdata.score = Vars.state.map.getHightScore();
            saveMapData(Vars.state.map, mdata);
            break;
        default:
            break;
    }
});
//#endregion
