var Q = require('q');
var CacheFile = require('./cacheFile');
var _ = require('underscore');
var URL = require('url');

function Cacher(opts) {
	this._cacheDir = opts.cacheDir;
	this._hosts = opts.hosts || [];
};
module.exports = Cacher;

/**
 * Get the cache path for a given URL
 *
 * returns a promise with the CacheFile, it might resolve with
 * undefined in which case it shouldn't be cached
 */
Cacher.prototype.getCacheFile = function(url) {
	var self = this;
	return this.getInfo(url)
	.then(function(info) {
		if (info && info.cache) {
			return new CacheFile(self._cacheDir, info.path);
		} else {
			return Q();
		}
	});
}

/**
 * Get cache info for a given url
 *
 * will be { 
 *   path: 'relative storage path',
 *   cache: boolean
 * }
 */
Cacher.prototype.getInfo = function(url) {
	var url = URL.parse(url);
	var host = url.host;
	var self = this;

	if (_.some(this._hosts, function(h) { return h == host; })) {
		return Q({
			path: host + url.path,
			// out right reject stuff that's obviously a directory
			cache: !url.path.match(/\/$/),
		});
	} else {
		return Q();
	}
}
