"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaps = updateMaps;
var config_1 = require("./config");
var promise_js_1 = require("./promise.js");
var utils_js_1 = require("./utils.js");
//if we switch to a self-hosted setup, just make it respond with the githubfile object for a drop-in replacement
function fetchGithubContents() {
    return new promise_js_1.Promise(function (resolve, reject) {
        var url = config_1.mapRepoURLs[config_1.Mode.name()];
        if (!url)
            return reject("no recognized gamemode detected. please enter \"host <map> <gamemode>\" and try again");
        Log.info("Requesting github repository contents at ".concat(url, "."));
        Http.get(url, function (res) {
            try {
                //Trust github to return valid JSON data
                resolve(JSON.parse(res.getResultAsString()));
            }
            catch (e) {
                reject("Failed to parse GitHub repository contents: ".concat(e));
            }
        }, function () { return reject("Network error while fetching github repository contents"); });
    });
}
function downloadFile(address, filename) {
    if (!/^https?:\/\//i.test(address)) {
        (0, utils_js_1.crash)("Invalid address, please start with 'http://' or 'https://'");
    }
    return new promise_js_1.Promise(function (resolve, reject) {
        var instream = null;
        var outstream = null;
        Log.info("Downloading ".concat(filename, "..."));
        Http.get(address, function (res) {
            try {
                instream = res.getResultAsStream();
                outstream = new Fi(filename).write();
                instream.transferTo(outstream);
                resolve();
            }
            finally {
                instream === null || instream === void 0 ? void 0 : instream.close();
                outstream === null || outstream === void 0 ? void 0 : outstream.close();
            }
        }, function () {
            Log.err("Download failed.");
            reject("Network error while downloading a map file: ".concat(address));
        });
    });
}
function downloadMaps(githubListing) {
    return promise_js_1.Promise.all(githubListing.map(function (fileEntry) {
        if (!(typeof fileEntry.download_url == "string")) {
            Log.warn("Map ".concat(fileEntry.name, " has no valid download link, skipped."));
            return promise_js_1.Promise.resolve(null);
        }
        return downloadFile(fileEntry.download_url, Vars.customMapDirectory.child(fileEntry.name).absolutePath());
    })).then(function (v) { });
}
function updateMaps() {
    //get github map listing
    return fetchGithubContents().then(function (listing) {
        //filter only valid mindustry maps
        var mapList = listing
            .filter(function (entry) { return entry.type == 'file'; })
            .filter(function (entry) { return /\.msav$/.test(entry.name); });
        var mapFiles = Vars.customMapDirectory.list();
        var removedMaps = mapFiles.filter(function (localFile) {
            return !mapList.some(function (remoteFile) {
                return remoteFile.name === localFile.name();
            })
                && !localFile.name().startsWith("$$");
        });
        removedMaps.forEach(function (map) {
            Log.info("Deleting map ".concat(map.name()));
            map.delete();
        });
        var newMaps = mapList
            .filter(function (entry) {
            var file = Vars.customMapDirectory.child(entry.name);
            return !file.exists() || entry.sha !== (0, utils_js_1.getHash)(file); //sha'd
        });
        if (newMaps.length == 0) {
            Log.info("No map updates found.");
            return;
        }
        return downloadMaps(newMaps).then(function () {
            Log.info("Downloads complete, registering maps.");
            Vars.maps.reload();
        });
    });
}
