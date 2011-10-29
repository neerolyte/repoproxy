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
	this.paths = {};
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


/**
 * Get an array of the immediate children
 *
 * @param path the path relative to the repo
 */
Repo.prototype.getChildren = function(path) {
	return this.getChildrenWorker(path.split('/'), this.paths);
};

/**
 * Internal get children function that does the
 * heavy lifting
 */
Repo.prototype.getChildrenWorker = function(query, paths) {
	if (query[0] == '') {
		query.shift();
		return this.getChildrenWorker(query, paths);
	}
	if (!query.length) return paths;
	if (query[0] in paths) {
		var subPaths = paths[query[0]];
		query.shift();
		return this.getChildrenWorker(query, subPaths);
	}

	// not found !
	return null;
};

/**
 * Stores a file path for directory indexing
 */
Repo.prototype.addFile = function(pathname) {
	this.addFileWorker(pathname.split('/'), this.paths);
};

/**
 * Internal addFile function that does the heavy lifting
 */
Repo.prototype.addFileWorker = function(query, paths) {
	if (!query.length) return;
	var cur = query.shift();
	if (!(cur in paths))
		paths[cur] = {};
	this.addFileWorker(query, paths[cur]);
};