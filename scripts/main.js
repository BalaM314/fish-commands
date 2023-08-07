/**
 * Main file for Fish Commands.
 * Does not do anything other than requiring index.js.
 */

importPackage(Packages.arc);
importPackage(Packages.mindustry.type);
importPackage(Packages.java.util.regex);
importClass(Packages.java.lang.Runtime);
importClass(Packages.java.lang.ProcessBuilder);

//Polyfills
Object.entries = o => Object.keys(o).map(k => [k, o[k]]);
Object.values = o => Object.keys(o).map(k => o[k]);
Object.fromEntries = a => a.reduce((o, [k, v]) => { o[k] = v; return o; }, {});
//Arrow functions do not bind to "this"
Array.prototype.at = function(i){
	return this[i < 0 ? this.length + i : i];
}
String.prototype.at = function(i){
	return this[i < 0 ? this.length + i : i];
}
Array.prototype.flat = function(depth){
	depth = (depth == undefined) ? 1 : depth;
	return depth > 0 ? this.reduce((acc, item) =>
		acc.concat(Array.isArray(item) ? item.flat(depth - 1) : item)
	, []) : this;
}
//Fix rhino regex
if(/ae?a/.test("aeea")){
	RegExp.prototype.test = function(input){
		//overwrite with java regex
		return java.util.regex.Pattern.compile(this.source).matcher(input).find();
	};
}

require("index");