var Q = require('q');
var _ = require('underscore');
var _s = require('underscore.string');

function Repo(config) {
	this._config = config || {};
	this._prefixes = this._config.prefixes || [];
	this._name = this._config.name || '';
};
module.exports = Repo;

Repo.prototype.isFor = function(url) {
	return _.some(this._prefixes, function(prefix) {
		return _s.startsWith(url, prefix);
	});
}

Repo.prototype.getCachePath = function(url) {
	var stripped = this.stripPrefix(url);
	return this._name + '/' + stripped;;
}

Repo.prototype.stripPrefix = function(url) {
	var prefix =_.find(this._prefixes, function(prefix) {
		return _s.startsWith(url, prefix);
	});

	return _s.splice(url, 0, prefix.length, '');
}
