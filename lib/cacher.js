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
	var fullPath = this._cacheDir + '/data/' + file;
	
	return this._mkdirRecursive(path.dirname(fullPath))
	.then(function() {
		return Q(fs.createWriteStream(fullPath));
	});
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
Cacher.prototype.createReadStream = function(path) {
	return Q(false);
}
