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

// TODO: refactor to use serveDirectoryList()
Request.prototype.serveNonRepoDirectoryListing = function() {
	var self = this;
	this.clientRes.writeHead(
		200,
		{'Content-Type': 'text/html'}
	);
	for (var prefix in self.server.repos) {
		this.clientRes.write(
			'<a href="' + prefix + '/">' + prefix + '/</a><br />\n'
		);
	}
	this.clientRes.end();
};

Request.prototype.serveDirectoryList = function(dirs) {
	this.clientRes.writeHead(
		200,
		{'Content-Type': 'text/html'}
	);

	for (var dir in dirs) {
		this.clientRes.write(
			'<a href="' + dir + '/">' + dir + '/</a><br />\n'
		);
	}
	this.clientRes.end();
};

Request.prototype.update = function() {
	this.log.debug('Updating ' + this.clientReq.url)
	var self = this;
	var opts = this.getUpstreamOptions();

	if (!opts) return this.error(404);

	if (self.shouldCache()) {
	
		this.tmpStorePath = this.getStorePath() + '.tmp';
		
		// TODO: async
		wrench.mkdirSyncRecursive(path.dirname(this.tmpStorePath), 0777);
		
		this.fileStream = fs.createWriteStream(this.tmpStorePath);
		
		// TODO: Is this a NodeJS specific bug?
		// catch and throw so that the stack trace brings us back here
		this.fileStream.addListener('error', function(err) {
			self.error(503, 'fileStream failed: ' + err.toString());
		})
	} // end should cache

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
			if (self.shouldCache()) self.fileStream.write(chunk);
		});
		res.on('end', function() {
			self.clientRes.end();
			if (self.shouldCache()) {
				self.fileStream.end();
				// TODO: async
				fs.renameSync(self.tmpStorePath, self.getStorePath());
			}
		});
	});
};

/**
 * Not all requests should be cached, should this one?
 */
Request.prototype.shouldCache = function() {
	// just check extensions for now... could be much better
	if (this.clientReq.url.match(/\.(rpm|deb|dsc|gz|bz2)$/)) {
		return true;
	}
	
	// random files that need to be cached too
	if (this.clientReq.url.match(/\/(Release|Packages)$/)) {
		return true;
	}
	
	return false;
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
	if (path[path.length - 1] == '/')
		path = path.substring(0, path.length - 1);
	return path;
};
