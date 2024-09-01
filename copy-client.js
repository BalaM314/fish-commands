const fs = require("fs");
require('child_process')
	.spawn('clip')
	.stdin.end(
		fs.readFileSync("scripts/client.js", "utf-8")
		.replace(`"use strict";\r\n`, "")
		.replace(/ +/g, " ")
		.replace(/\r\n/g, "")
		.replace(/\/\*.+\*\//, "")
		.replace(`Object.defineProperty(exports, "__esModule", { value: true });`, "")
	);