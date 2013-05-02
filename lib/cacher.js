var fs = require('fs');
var Q = require('q');
var path = require('path');
var mkdirp = require('mkdirp');

function Cacher(opts) {
	this._cacheDir = opts.cacheDir;
};
module.exports = Cacher;

/**
 * get a write stream for a given cache path
 *
 * returns a promise that should resolve with a Write Stream eventually
 */
Cacher.prototype.createWriteStream = function(file) {
	file = this._getDataPath(file);
	
	return this._mkdirRecursive(path.dirname(file))
	.then(function() {
		return Q(fs.createWriteStream(file));
	});
}

/**
 * Get a data path for a given file path
 */
Cacher.prototype._getDataPath = function(file) {
	return this._cacheDir + '/data/' + file;
}

Cacher.prototype._mkdirRecursive = function(dir) {
	var deferred = Q.defer();
	mkdirp(dir, deferred.makeNodeResolver());
	return deferred.promise;
}

/**
 * get a read stream for a given cache path
 * returns a promise that will resolve to false
 * if there is no valid cache for the given path
 */
Cacher.prototype.createReadStream = function(file) {
	var deferred = Q.defer();

	file = this._getDataPath(file);
	fs.exists(file, function(exists) {
		if (exists) {
			deferred.resolve(fs.createReadStream(file));
		} else {
			deferred.resolve(false);
		}
	});

	return deferred.promise;
}
