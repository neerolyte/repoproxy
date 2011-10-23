/**
 * A single Linux repository of some sort
 */
var util = require('util');

module.exports.createRepo = function(opts) {
	if (opts.type) {
		var repoType = require('./repo'+opts.type);
		return new repoType.Repo(opts);
	} else {
		return new Repo(opts);
	}
};

function Repo(options) {
	this.prefix = options.prefix;
	this.upstream = options.upstream;
}
module.exports.Repo = Repo;
	
Repo.prototype.getUpstreamOptions = function(req) {
	var opts = {};
	for (var opt in this.upstream)
		opts[opt] = this.upstream[opt];
	opts.path = opts.path + req.url.substring(this.prefix.length);

	return opts;
};

Repo.prototype.serve = function(req) {
	// TODO: finish moving serving code under repo
	req.serveFromCache();
};