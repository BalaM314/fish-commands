"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the code for automated map syncing.
Original contributor: @author Jurorno9
Maintenance: @author BalaM314
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaps = updateMaps;
var config_1 = require("./config");
var promise_1 = require("./promise");
var utils_1 = require("./utils");
//if we switch to a self-hosted setup, just make it respond with the githubfile object for a drop-in replacement
function fetchGithubContents() {
    return new promise_1.Promise(function (resolve, reject) {
        var url = config_1.mapRepoURLs[config_1.Gamemode.name()];
        if (!url)
            return reject("No recognized gamemode detected. please enter \"host <map> <gamemode>\" and try again");
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
        (0, utils_1.crash)("Invalid address, please start with 'http://' or 'https://'");
    }
    return new promise_1.Promise(function (resolve, reject) {
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
    return promise_1.Promise.all(githubListing.map(function (fileEntry) {
        if (!(typeof fileEntry.download_url == "string")) {
            Log.warn("Map ".concat(fileEntry.name, " has no valid download link, skipped."));
            return promise_1.Promise.resolve(null);
        }
        return downloadFile(fileEntry.download_url, Vars.customMapDirectory.child(fileEntry.name).absolutePath());
    })).then(function (v) { });
}
/**
 * @returns whether any maps were changed
 */
function updateMaps() {
    //get github map listing
    return fetchGithubContents().then(function (listing) {
        //filter only valid mindustry maps
        var mapList = listing
            .filter(function (entry) { return entry.type == 'file'; })
            .filter(function (entry) { return /\.msav$/.test(entry.name); });
        var mapFiles = Vars.customMapDirectory.list();
        var mapsToDelete = mapFiles.filter(function (localFile) {
            return !mapList.some(function (remoteFile) {
                return remoteFile.name === localFile.name();
            })
                && !localFile.name().startsWith("$$");
        });
        mapsToDelete.forEach(function (map) { return map.delete(); });
        var mapsToDownload = mapList
            .filter(function (entry) {
            var file = Vars.customMapDirectory.child(entry.name);
            return !file.exists() || entry.sha !== (0, utils_1.getHash)(file); //sha'd
        });
        if (mapsToDownload.length == 0) {
            return mapsToDelete.length > 0 ? true : false;
        }
        return downloadMaps(mapsToDownload).then(function () {
            Vars.maps.reload();
            return true;
        });
    });
}
