/**
 * A cacheable file is a representation of a URL that should be cacheable
 * it can be requested for the actual cache entry (which may not exist)
 * and it can be told to update the actual file, the consumer of cacheable
 * file need not know where the file is actually stored.
 */
var Q = require('q');
var FS = require('q-io/fs');
var Reader = require('q-io/reader');
var path = require('path');
var moment = require('moment');
var util = require('util');
var Events = require('events');
var _ = require('underscore');
var ReadableFileWriter = require('./readableFileWriter');

/**
 * Create the cacheable file
 *
 * @param cacheDir - the directory containing all repository cache
 * @param file - the file we want relative to the cacheDir
 */
function CacheFile(cacheDir, file) {
	this._cacheDir = cacheDir;
	this._file = file;
	this._writer = null;
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
		this.makeTree('temp-meta'),
	]).then(function() {
		return FS.write(self.getPath('temp-meta'), JSON.stringify(meta));
	}).then(function() {
		return FS.move(self.getPath('temp-data'), self.getPath('data'));
	}).then(function() {
		return FS.move(self.getPath('temp-meta'), self.getPath('meta'));
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

/**
 * Sets up a stream writer for a given cachefile
 *
 * The writer will send data to disk + any readers
 * that are already attached or become attached
 */
CacheFile.prototype.getWriter = function() {
	var self = this;
	return this.makeTree('temp-data')
	.then(function() {
		return ReadableFileWriter.create(self.getPath('temp-data'));
	}).then(function(writer) {
		self._writer = writer;
		return self._writer;
	});
}

/**
 * Get a stream reader
 *
 * If there's an active writer running for this cache
 * file we should attach to that, otherwise we should
 * read from disk
 */
CacheFile.prototype.getReader = function() {
	if (this._writer && !this._writer.closed) {
		return Q(this._writer.getReader());
	} else {
		return FS.open(this.getPath(), {
			flags: "rb"
		});
	}
}
