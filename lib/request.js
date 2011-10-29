var fs = require('fs');
var wrench = require('wrench');
var path = require('path');
var http = require('http');
var util = require('util');

module.exports.createRequest = function(server, clientReq, clientRes) {
	return new Request(server, clientReq, clientRes);
};

/**
 * Wrap a nice bundle of references to the various client/upstream req/res and FDs we need
 *
 * @param server the Server who we belong to
 * @param clientReq the http request that came from the client we are serving
 * @param clientRes the http response we will eventually answer
 */
function Request(server, clientReq, clientRes) {
	this.server = server;
	this.clientReq = clientReq;
	this.clientRes = clientRes;
	this.log = this.server.log;
	this.repo = this.server.getRepoByRequest(clientReq);
}

Request.prototype.serve = function() {
	if (this.repo)
		this.repo.serve(this);
	else
		this.serveNonRepoDirectoryListing();
};

Request.prototype.serveNonRepoDirectoryListing = function() {
	var self = this;
	this.clientRes.writeHead(
		200,
		{'Content-Type': 'text/html'}
	);
	for (var prefix in self.server.repos) {
		this.clientRes.write(
			'<a href="' + prefix + '">' + prefix + '</a><br />\n'
		);
	}
	this.clientRes.end();
};

Request.prototype.serveFromCache = function() {
	var self = this;

	var storePath = this.getStorePath();
	this.log.debug("Storing under " + storePath);
	
	this.readStream = fs.createReadStream(storePath);
	
	this.readStream.addListener('error', function(err) {
		if (err.code == 'ENOENT')
			self.update();
		else {
			self.error(503, err.toString());
		}
	});
	
	this.log.debug('Retrieving ' + this.clientReq.url)
	this.readStream.pipe(this.clientRes);
};

Request.prototype.update = function() {
	this.log.debug('Updating ' + this.clientReq.url)
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
		self.error(503, 'fileStream failed: ' + err.toString());
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

Request.prototype.error = function(code, message) {
	this.log.error('code: ' + code + ', message: ' + message);
	this.clientRes.writeHead(code, {'Content-Type': 'text/plain'});
	this.clientRes.write('ERROR: ' + code + '\n');
	if (message)
		this.clientRes.write(message);
	this.clientRes.end();
	//if (this.fileStream)
	//	this.fileStream.end();
};

Request.prototype.getStorePath = function() {
	return this.server.getStorePath(this.clientReq);
};

Request.prototype.getUpstreamOptions = function() {
	return this.server.getUpstreamOptions(this.clientReq);
};

/**
 * Get the path of this request relative to the repo that it belongs to
 */
Request.prototype.getRelativePath = function() {
	var path = this.clientReq.url.substring(this.repo.prefix.length);
	// remove trailing slash
	if (path.charAt(path.length - 1) == '/')
		path = path.substring(0, path.length - 1);
	return path;
};