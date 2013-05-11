/**
 * A cacheable file is a representation of a URL that should be cacheable
 * it can be requested for the actual cache entry (which may not exist)
 * and it can be told to update the actual file, the consumer of cacheable
 * file need not know where the file is actually stored.
 */
var Q = require('q');
var FS = require('q-io/fs');

/**
 * Create the cacheable file
 *
 * @param fs - a rerooted q-io fs to the top of the cacheDir
 *  see: https://github.com/kriskowal/q-io#rerootpath
 * @param file - the file we want
 */
function CacheFile(cacheDir, file) {
	this._cacheDir = cacheDir;
	this._file = file;
};
module.exports = CacheFile;

CacheFile.prototype.exists = function() {
	return FS.exists(this.getPath());
}

CacheFile.prototype.getPath = function() {
	return this._cacheDir + '/data/' + this._file;
}

CacheFile.prototype.getReader = function() {
	return FS.open(this.getPath(), {
		flags: "rb"
	});
}

CacheFile.prototype.getWriter = function() {
	return FS.open(this.getPath(), {
		flags: "wb"
	});
}
