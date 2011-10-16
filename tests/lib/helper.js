/**
 * Code to help unit tests run
 */
var wrench = require('wrench') // https://github.com/ryanmcgrath/wrench-js
var fs = require('fs')

exports.config = {
	ports: {
		proxy: 12345,
		yumproxy: 12348,
		webserver: 12346,
		init: 12347
	},
	dirs: {
		cache: __dirname + '/tmp_cache',
	},
	files: {
		accessLog: __dirname + '/tmp_access.log'
	}
};

/**
 * Clean up all temporary files/dirs that tests might create
 */
exports.cleanUpTmp = function() {
	for (var d in this.config.dirs) {
		var dir = this.config.dirs[d];
		try {
			var stat = fs.statSync(dir);
			if (stat && stat.isDirectory())
				wrench.rmdirSyncRecursive(dir);
		} catch (e) {
			// ignore errors if directory is already missing
			if (e.code != 'ENOENT')
				throw e;
		}
	}

	for (var f in this.config.files) {
		var file = this.config.files[f];
		try {
			var stat = fs.statSync(file);
			if (stat && stat.isFile())
				fs.unlinkSync(file);
		} catch (e) {
			// ignore errors if file is already missing
			if (e.code != 'ENOENT')
				throw e;
		}
	}
};

/**
 * Sets up requested objects for a test
 */
exports.setUp = function(data) {
	if (data.dirs) {
		for (var d in data.dirs) {
			fs.mkdirSync(data.dirs[d], 0700);
		}
	}
};
