/**
 * A single Linux repository of some sort
 */
module.exports.createRepo = function(opts) {
	return new Repo(opts);
};

function Repo(options) {
	this.upstream = options.upstream;
	this.prefix = options.prefix;
}
module.exports.Repo = Repo;
	
Repo.prototype.getUpstreamOptions = function(req) {
	var opts = {};
	for (var opt in this.upstream)
		opts[opt] = this.upstream[opt];
	opts.path = opts.path + req.url.substring(this.prefix.length);

	return opts;
};
