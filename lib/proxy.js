var util = require('util');
var http = require('http');
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
		request.createRequest(this, req, res);
	});

	this.options = options || {};
	this.repos = this.options.repos || [];

	this.log = logger.createLogger();
}
util.inherits(Server, http.Server);
exports.Server = Server;

Server.prototype.getStorePath = function(req) {
	return this.options.cacheDir + path.normalize(req.url);
};

// options hash in http.get() friendly format: http://nodejs.org/docs/v0.4.11/api/all.html#http.get
Server.prototype.getUpstreamOptions = function(req) {
	for (var i in this.repos) {
		var repo = this.repos[i];
		if (repo.prefix == req.url.substring(0, repo.prefix.length)) {
			var opts = {};
			for (var opt in repo.options)
				opts[opt] = repo.options[opt];
			opts.path = opts.path + req.url.substring(repo.prefix.length);
			return opts;
		}
	}
	
	// not found!
	return null;
};
