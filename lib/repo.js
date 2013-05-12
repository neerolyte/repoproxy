var Q = require('q');
var _ = require('underscore');
var _s = require('underscore.string');

function Repo(config) {
	this._config = config || {};
	this._prefixes = this._config.prefixes || [];
	this._name = this._config.name || '';
};
module.exports = Repo;

/**
 * Check if the given URL belongs to this repo, if it does
 * return an object with info about how to cache it
 */
Repo.prototype.getInfo = function(url) {
	var prefix = _.find(this._prefixes, function(prefix) {
		return _s.startsWith(url, prefix);
	});

	if (prefix) {
		var path = this._name + '/' + _s.splice(url, 0, prefix.length, '');
		return this._getInfo(url, path);
	} else {
		// this repo doesn't handle this prefix
		return;
	}
}

/**
 * We've decided we own this URL, figure out how to cache it
 */
Repo.prototype._getInfo = function(url, path) {
	// out right reject stuff that's obviously a directory
	var cache = !url.match(/\/$/);

	return {
		cache: cache,
		path: path,
	};
}
