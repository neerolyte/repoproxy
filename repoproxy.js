#!/usr/bin/env node

require("coffee-script");
var Proxy = require('./lib/proxy');
var Cleaner = require('./lib/cleaner');
var yaml = require('js-yaml');
var stripJSONComments = require('strip-json-comments');
var fs = require('fs');

var config;
// try json config first
try {
	config = JSON.parse(
		stripJSONComments(fs.readFileSync('./config.json', "utf-8"))
	);
} catch (e) {
	// if it's missing
	if (e.code == 'ENOENT' && fs.existsSync('./config.yaml')) {
		// try yaml
		config = yaml.load(
			fs.readFileSync('./config.yaml', "utf-8")
		);
	} else {
		throw e;
	}
}

// if cacheDir is relative, make it absolute
if (!config.cacheDir.match(/^\//)) {
	config.cacheDir = process.cwd() + '/' + config.cacheDir;
}

var proxy = new Proxy(config);
proxy.on("log", console.log);
proxy.listen();

var cleaner = new Cleaner(config);
function cleanAndQueue() {
	console.log("Cleaning");
	cleaner.clean().then(function() {
		console.log("Clean completed");
		setTimeout(function() {
			cleanAndQueue();
		}, 30*60*1000);
	});
}
cleanAndQueue();
