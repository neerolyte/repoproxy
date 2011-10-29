var util = require('util');
var http = require('http');
var sys = require('sys');
var path = require('path');
var wrench = require('wrench');
var logger = require('./logger');
var request = require('./request');

exports.createServer = function(options, requestListener) {
	return new Server(options, requestListener);
}

function Server(options) {
	http.Server.call(this);

	this.addListener('request', function(req, res) {
		request.createRequest(this, req, res).serve();
	});

	this.options = options || {};
	
	this.repos = {};
	for (var i in this.options.repos) {
		this.addRepo(
			require('./repo').createRepo(this.options.repos[i])
		);
	}

	this.log = logger.createLogger();
}
util.inherits(Server, http.Server);
exports.Server = Server;

Server.prototype.addRepo = function(repo) {
	if (!(repo instanceof require('./repo').Repo))
		repo = require('./repo').createRepo(repo);
	this.repos[repo.prefix] = repo;
};

/**
 * @param req client side http request
 */
Server.prototype.getRepoByRequest = function(req) {
	// longest match first of repo prefixes
	var prefix = req.url;

	if (prefix[prefix.length - 1] == '/') {
		prefix = prefix.substr(0, prefix.length - 1);
	}
	
	while (prefix.length > 1) {
		if (prefix in this.repos) {
			return this.repos[prefix];
		}
		prefix = path.dirname(prefix);
	}
	
	return this.repos['/']; // might return undefined if there's no default
};

Server.prototype.getStorePath = function(req) {
	return this.options.cacheDir + path.normalize(req.url);
};

// options hash in http.get() friendly format: http://nodejs.org/docs/v0.4.11/api/all.html#http.get
Server.prototype.getUpstreamOptions = function(req) {
	var repo = this.getRepoByRequest(req);
	if (!repo) return null;
	return repo.getUpstreamOptions(req);
};
