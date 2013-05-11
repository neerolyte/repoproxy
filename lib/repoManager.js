var Q = require('q');
var Repo = require('./repo');
var _ = require('underscore');

function RepoManager() {
	this._repos = [];
};
module.exports = RepoManager;

/**
 * Get the cache path for a given URL
 *
 * returns a promise with the path, it might resolve with
 * undefined in which case it shouldn't be cached
 */
RepoManager.prototype.getCachePath = function(url) {
	return this.getRepo(url)
	.then(function(repo) {
		if (repo) {
			return repo.getCachePath(url);
		} else {
			return Q();
		}
	});
}

/**
 * Get the repo for a particular path
 *
 * will reject the promise if no repo matches
 */
RepoManager.prototype.getRepo = function(url) {
	var repo = _.find(this._repos, function(r) {
		return r.isFor(url);
	});

	return Q(repo);
}

/**
 * Add some config for another repo
 */
RepoManager.prototype.addRepo = function(config) {
	this._repos.push(new Repo(config));
}

/**
 * Gets a cacheable file representation for a given URL
 */
RepoManager.prototype.getCacheableFile = function(url) {
	return Q();
}
