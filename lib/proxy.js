var util = require('util');
var http = require('http');
var fs = require('fs');
var sys = require('sys');

exports.createServer = function(options, requestListener) {
	return new Server(options, requestListener);
}

function Server(options) {
	http.Server.call(this);

	this.addListener('request', function(req, res) {
		new RepoRequest(this, req, res);
	});

	this.options = options || {};
	this.repos = this.options.repos || [];
}
util.inherits(Server, http.Server);
exports.Server = Server;

Server.prototype.tryCache = function(req, res) {
};

Server.prototype.getStorePath = function(req) {
	return this.options.cacheDir + req.url;
};

// options hash in http.get() friendly format: http://nodejs.org/docs/v0.4.11/api/all.html#http.get
Server.prototype.getUpstreamOptions = function(req) {
	for (var i in this.repos) {
		var repo = this.repos[i];
		if (repo.prefix == req.url.substring(0, repo.prefix.length)) {
			var opts = repo.options.valueOf();
			opts.path = opts.path + req.url.substring(repo.prefix.length);
			return opts;
		}
	}
	
	throw new Error("TODO: What happens when no repos match? (Hint: Oh noes four oh fours!)");
};

/**
 * Wrap a nice bundle of references to the various client/upstream req/res and FDs we need
 *
 * @param server the Server who we belong to
 * @param clientReq the http request that came from the client we are serving
 * @param clientRes the http response we will eventually answer
 */
function RepoRequest(server, clientReq, clientRes) {
	var self = this;

	this.server = server;
	this.clientReq = clientReq;
	this.clientRes = clientRes;

	fs.open(this.getStorePath(), 'r', 0666, function(err, fd) {
		self.triedCache(err, fd);
	});
}

RepoRequest.prototype.triedCache = function(err, fd) {
	if (typeof(fd) == 'undefined') {
		// no cache, better make something yummy
		this.update();
	} else {
		throw new Error('I really should write some code here.');
	}
};

RepoRequest.prototype.update = function() {
	var self = this;
	var opts = this.getUpstreamOptions();

	//this.fileStream = fs.createWriteStream(this.getStorePath() + '.tmp');

	//this.fileStream.addListener('error', function(err) {
	//	sys.debug(err);
	//})

	http.get(opts, function(res) {
		res.on('data', function(chunk) {
			self.clientRes.write(chunk);
			//self.fileStream.write(chunk);
		});
		res.on('end', function() {
			self.clientRes.end();
			//self.fileStream.end();
		});

	});
};

RepoRequest.prototype.getStorePath = function() {
	return this.server.getStorePath(this.clientReq);
};

RepoRequest.prototype.getUpstreamOptions = function() {
	return this.server.getUpstreamOptions(this.clientReq);
};

