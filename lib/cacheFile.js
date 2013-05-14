/**
 * A cacheable file is a representation of a URL that should be cacheable
 * it can be requested for the actual cache entry (which may not exist)
 * and it can be told to update the actual file, the consumer of cacheable
 * file need not know where the file is actually stored.
 */
var Q = require('q');
var FS = require('q-io/fs');
var path = require('path');
var moment = require('moment');
var util = require('util');

/**
 * Create the cacheable file
 *
 * @param cacheDir - the directory containing all repository cache
 * @param file - the file we want relative to the cacheDir
 */
function CacheFile(cacheDir, file) {
	this._cacheDir = cacheDir;
	this._file = file;
};
module.exports = CacheFile;

CacheFile.prototype.exists = function() {
	return Q.all([
		FS.exists(this.getPath()),
		FS.exists(this.getPath('meta')),
	]).then(function(res) {
		return res[0] && res[1];
	});
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
	var path = this.getPath('meta');
	return FS.isFile(path)
	.then(function(isFile) {
		if (isFile) {
			return FS.read(path)
			.then(function(contents) {
				return JSON.parse(contents);
			});
		} else {
			return Q();
		}
	});
}

/**
 * Sets up a stream writer for a given cachefile
 */
CacheFile.prototype.getWriter = function() {
	var self = this;
	return this.makeTree('temp')
	.then(function() {
		return FS.open(self.getPath('temp'), {
			flags: "wb"
		});
	});
}

/**
 * Once a file has been written out it should be saved with optional
 * cache metadata
 */
CacheFile.prototype.save = function(meta) {
	var self = this;
	if (!meta) meta = {};
	meta.expiry = meta.expiry || moment().add('minutes', 30);
	return Q.all([
		this.makeTree('data'),
		this.makeTree('meta'),
	]).then(function() {
		return FS.move(self.getPath('temp'), self.getPath('data'));
	}).then(function() {
		return FS.write(self.getPath('meta'), JSON.stringify(meta));
	});
}

CacheFile.prototype.makeTree = function(type) {
	if (!type) type = 'data';
	var dir = path.dirname(this.getPath(type));
	return FS.makeTree(dir);
}

/**
 * Check simple metadata for whether it's expired or not
 */
CacheFile.prototype.expired = function() {
	return this.getMeta()
	.then(function(meta) {
		return !meta || !meta.expiry
			|| moment(meta.expiry) < moment();
	});
}
