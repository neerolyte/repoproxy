var Q = require('q');
var _ = require('underscore');
var _s = require('underscore.string');

function Repo(config) {
	this._config = config || {};
	this._prefixes = this._config.prefixes || [];
	this._name = this._config.name || '';
};
module.exports = Repo;

Repo.prototype.getInfo = function(url) {
	var prefix = _.find(this._prefixes, function(prefix) {
		return _s.startsWith(url, prefix);
	});

	if (prefix) {
		return {
			path: this._name + '/' + _s.splice(url, 0, prefix.length, '')
		};
	} else {
		return;
	}
}
