"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaps = void 0;
var config_1 = require("./config");
//if we switch to a self-hosted setup, just make it respond with the githubfile object for a drop-in replacement
function fetchGithubContents(callback) {
    var url = config_1.mapRepoURLs[config_1.Mode.name()];
    if (!url) {
        Log.err("no recognized gamemode detected. please enter \"host <map> <gamemode>\" and try again");
        callback(null);
        return;
    }
    Log.info("Requesting github repository contents at ".concat(url, "."));
    Http.get(url, function (res) {
        try {
            var jsonStr = res.getResultAsString();
            var parsed = JSON.parse(jsonStr);
            Log.info("Request success, checking maps");
            callback(parsed);
        }
        catch (e) {
            Log.err("Failed to parse GitHub repository contents: ".concat(e));
            callback(null);
        }
    }, function () {
        Log.err("Failed to fetch github repository contents");
        callback(null);
        return;
    });
}
//clean? no. functional? yeah.
function getFile(address, callback, filename) {
    if (!/^https?:\/\//i.test(address)) {
        Log.err("Invalid address, please start with 'http://' or 'https://'");
        callback(false);
        return;
    }
    var instream = null;
    var outstream = null;
    Log.info("Downloading ".concat(filename, " from ").concat(address));
    Http.get(address, function (res) {
        instream = res.getResultAsStream();
        outstream = Vars.customMapDirectory.child(filename).write();
        instream.transferTo(outstream);
        instream.close();
        outstream.close();
        callback(true);
        return;
    }, function () {
        if (instream)
            instream.close();
        if (outstream)
            outstream.close();
        Log.err("Download failed.");
        callback(false);
        return;
    });
}
function sequentialMapDownload(githubListing, index, callback) {
    if (index >= githubListing.length) {
        Log.info("All maps downloaded.");
        callback();
        return;
    }
    var fileEntry = githubListing[index];
    if (!fileEntry.download_url) {
        Log.warn("Map ".concat(fileEntry.name, " has no valid download link, skipped."));
        sequentialMapDownload(githubListing, index + 1, callback);
        return;
    }
    getFile(fileEntry.download_url, function () {
        sequentialMapDownload(githubListing, index + 1, callback);
    }, Vars.customMapDirectory.child(fileEntry.name).name());
}
function updateMaps(callback) {
    //get github map listing
    fetchGithubContents(function (listing) {
        if (listing == null) {
            callback(false);
            return;
        }
        //filter only valid mindustry maps
        var mapList = listing
            .filter(function (entry) { return entry.type == 'file'; })
            .filter(function (entry) { return /\.msav$/.test(entry.name); });
        //delete unfound maps
        var mapFiles = Vars.customMapDirectory.list();
        var unfoundMaps = mapFiles.filter(function (localFile) {
            return !mapList.some(function (onlineFile) {
                return onlineFile.name === localFile.name();
            });
        });
        unfoundMaps.forEach(function (map) {
            Log.info("Deleting map ".concat(map.name(), " - Not found in github repository."));
            map.delete();
        });
        //eliminate up to date maps
        var outDatedMapsList = mapList
            .filter(function (entry) { return !(Vars.customMapDirectory.child(entry.name).exists() && Vars.customMapDirectory.child(entry.name).length() > 0); });
        if (outDatedMapsList.length == 0) {
            Log.info("No map updates found.");
            callback(true);
            return;
        }
        else {
            sequentialMapDownload(outDatedMapsList, 0, function () {
                Log.info("Downloads complete, registering maps.");
                try {
                    Vars.maps.reload;
                    Log.info("Map update complete");
                    callback(true);
                    return;
                }
                catch (e) {
                    Log.info("failed to register 1 or more maps, ".concat(e));
                    callback(false);
                    return;
                }
            });
        }
    });
}
exports.updateMaps = updateMaps;
