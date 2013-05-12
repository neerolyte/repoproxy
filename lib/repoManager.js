var Q = require('q');
var Repo = require('./repo');
var CacheFile = require('./cacheFile');
var _ = require('underscore');

function RepoManager(opts) {
	this._repos = [];
	this._cacheDir = opts.cacheDir;
};
module.exports = RepoManager;

/**
 * Get the cache path for a given URL
 *
 * returns a promise with the CacheFile, it might resolve with
 * undefined in which case it shouldn't be cached
 */
RepoManager.prototype.getCacheFile = function(url) {
	var self = this;
	return this.getRepoInfo(url)
	.then(function(info) {
		if (info && info.cache) {
			return new CacheFile(self._cacheDir, info.path);
		} else {
			return Q();
		}
	});
}

/**
 * Get repo info for a given url
 *
 * will be { path: 'relative storage path' }
 */
RepoManager.prototype.getRepoInfo = function(url) {
	var info;
	var repo = _.find(this._repos, function(r) {
		return info = r.getInfo(url);
	});

	return Q(info);
}

/**
 * Add some config for another repo
 */
RepoManager.prototype.addRepo = function(config) {
	this._repos.push(new Repo(config));
}
