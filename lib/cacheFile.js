/**
 * A cacheable file is a representation of a URL that should be cacheable
 * it can be requested for the actual cache entry (which may not exist)
 * and it can be told to update the actual file, the consumer of cacheable
 * file need not know where the file is actually stored.
 */
var Q = require('q');
var FS = require('q-io/fs');
var path = require('path');

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

CacheFile.prototype.getPath = function(type) {
	if (!type) type = 'data';
	return this._cacheDir + '/' + type + '/' + this._file;
}

CacheFile.prototype.getReader = function() {
	return FS.open(this.getPath(), {
		flags: "rb"
	});
}

CacheFile.prototype.getMeta = function() {
	return FS.read(this.getPath('meta'))
	.then(function(contents) {
		return JSON.parse(contents);
	});
}

/**
 * Sets up a stream writer for a given cachefile
 *
 * @param meta is an object full of metadata to store with this file
 */
CacheFile.prototype.getWriter = function(meta) {
	var self = this;
	if (!meta) meta = null;
	return Q.all([
		this.makeTree('data'),
		this.makeTree('meta'),
	]).then(function() {
		return FS.write(self.getPath('meta'), JSON.stringify(meta));
	}).then(function() {
		return FS.open(self.getPath(), {
			flags: "wb"
		});
	});
}

CacheFile.prototype.makeTree = function(type) {
	if (!type) type = 'data';
	var dir = path.dirname(this.getPath(type));
	return FS.makeTree(dir);
}
