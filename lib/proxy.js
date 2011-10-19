var util = require("util");
var http = require("http");
var fs = require("fs");

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

Server.prototype.getUpstreamPath = function(req) {
	for (var i in this.repos) {
		var repo = this.repos[i];
		if (repo.prefix == req.url.substring(0, repo.prefix.length)) {
			return repo.upstream + req.url.substring(repo.prefix.length);
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

	fs.open(this.server.getStorePath(this.clientReq), 'r', 0666, function(err, fd) {
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
	console.log("now updating " + this.getStorePath())
	console.log("from " + this.getUpstreamPath())

	var client = http.createClient(address.port, '127.0.0.1');

	var req = client.request('GET', '/foo/bar.rpm', {});

	req.end();
	req.on('response', function(res) {
		test.equal('200', res.statusCode);
		res.on('data', function(chunk) {
			console.log("got data")
			if (!this.body) this.body = '';
			this.body += chunk;
		});
		res.on('end', function() {
			console.log("got end");
			test.equal(this.body, 'world\n');
			test.done();
		});
	});
	throw new Error('I really should write some code here.');
};

RepoRequest.prototype.getStorePath = function() {
	return this.server.getStorePath(this.clientReq);
};

RepoRequest.prototype.getUpstreamPath = function() {
	return this.server.getUpstreamPath(this.clientReq);
};

