var util = require('util');
var http = require('http');
var fs = require('fs');
var sys = require('sys');
var path = require('path');
var wrench = require('wrench');

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
	
	this.readStream = fs.createReadStream(
		this.getStorePath()
	);

	this.readStream.addListener('error', function(err) {
		if (err.code == 'ENOENT')
			self.update();
		else
			throw err;
	});
	
	this.readStream.pipe(clientRes);
}

RepoRequest.prototype.update = function() {
	var self = this;
	var opts = this.getUpstreamOptions();

	if (!opts) return this.error(404);

	this.tmpStorePath = this.getStorePath() + '.tmp';

	// TODO: async
	wrench.mkdirSyncRecursive(path.dirname(this.tmpStorePath), 0777);

	this.fileStream = fs.createWriteStream(this.tmpStorePath);

	// TODO: Is this a NodeJS specific bug?
	// catch and throw so that the stack trace brings us back here
	this.fileStream.addListener('error', function(err) {
		throw err;
	})

	http.get(opts, function(res) {
		if (res.statusCode != 200) {
			// 404 is special
			var code = (res.statusCode==404)?404:503;
			self.error(code, 'Upstream status code of: ' + res.statusCode);
			return;
		}
		self.clientRes.writeHead(200, {'Content-Type': res.headers['content-type']});
		res.on('data', function(chunk) {
			self.clientRes.write(chunk);
			self.fileStream.write(chunk);
		});
		res.on('end', function() {
			self.clientRes.end();
			self.fileStream.end();
			// TODO: async
			fs.renameSync(self.tmpStorePath, self.getStorePath());
		});
	});
};

RepoRequest.prototype.error = function(code, message) {
	this.clientRes.writeHead(code, {'Content-Type': 'text/plain'});
	this.clientRes.write('ERROR: ' + code + '\n');
	if (message)
		this.clientRes.write(message);
	this.clientRes.end();
};

RepoRequest.prototype.getStorePath = function() {
	return this.server.getStorePath(this.clientReq);
};

RepoRequest.prototype.getUpstreamOptions = function() {
	return this.server.getUpstreamOptions(this.clientReq);
};

