"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatemaps = exports.saveMapData = exports.getMapData = exports.downloadfile = exports.writefile = exports.readfile = void 0;
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
}
exports.writefile = writefile;
function downloadfile(filename, url, callback) {
    Log.info("Downloading ".concat(filename, " from ").concat(url));
    var file = Vars.customMapDirectory.child(filename);
    Http.get(url, function (res) {
        try {
            file.writeBytes(res.getResult());
            Log.info("Download complete ".concat(filename));
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
    return (readfile(map.file.nameWithoutExtention() + '.json'));
}
exports.getMapData = getMapData;
function saveMapData(map, mapData) {
    writefile(map.file.nameWithoutExtention() + '.json', mapData);
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
    var archives = Vars.customMapDirectory.child("/archives");
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
//very cursed
function mapSubdiretory() {
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
}
//slightly cursed
function updatemap(file) {
    if (!/\.json$/i.test(file.name) || !file.download_url) {
        Log.err("".concat(file.name, " is not a valid map json file"));
        return;
    }
    var oldMapData = readfile(file.name);
    archive(file.name);
    downloadfile(file.name, file.download_url, function (success) {
        if (!success) {
            Log.err("Download ".concat(file.name, " failed, attempting rollback."));
            rollback(file.name);
            return;
        }
        var mapName = file.name.split('.').slice(0, -1).join('.') + '.msav';
        var newMapData = readfile(file.name);
        if (newMapData.version == oldMapData.version || !file.download_url) {
            Log.info("Map ".concat(mapName, " is up to date"));
            return;
        }
        Log.info("Downloading map update for ".concat(mapName, " ..."));
        //hidious line that just alters the json download to a .msav download
        downloadfile(mapName, file.download_url.substring(0, file.download_url.lastIndexOf('.')) + '.msav', function (success) {
            if (!success) {
                Log.err("Failed to download map update, attempting rollback...");
                rollback(mapName);
                return;
            }
            Log.info("Map Updated ".concat(mapName, "..."));
        });
    });
}
//slightly less cursed
function updatemaps() {
    Log.info("fetching map list ...");
    Http.get(config_1.MAP_SOURCE_DIRECTORY + config_1.SURVIVAL_SUBDIRECTORY, function (res) {
        var responce = res.getResultAsString();
        var listing = JSON.parse(responce);
        var jsonListing = listing.filter(function (file) { return /\.json$/i.test(file.name); });
        jsonListing.forEach(function (file) {
            updatemap(file);
        });
        try {
            Vars.maps.reload();
        }
        catch (error) {
            Log.err("failed to register maps");
        }
    }, function () {
        Log.err("failed to fetch map list");
    });
    return;
}
exports.updatemaps = updatemaps;
//#endregion
