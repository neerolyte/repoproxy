var Q = require('q');
var HTTP = require('q-io/http');
var Apps = require("q-io/http-apps");
var Reader = require("q-io/reader");
var util = require('util');
var RepoManager = require('./repoManager');

function Proxy(opts) {
	this._listening = false;

	var self = this;
	this._server = HTTP.Server(function(request) {
		return self.application(request);
	});

	this._cacheDir = opts.cacheDir;

	this._repoManager = new RepoManager({ cacheDir: this._cacheDir });
};
module.exports = Proxy;

/**
 * The q-io/http application function
 *
 * This is the entry point in to the proxy, a request comes in,
 * a response goes out.
 */
Proxy.prototype.application = function(request) {
	var self = this;
	return this._repoManager.getCacheFile(request.url)
	.then(function(cacheFile) {
		if (cacheFile) {
			return self._appCacheable(request, cacheFile);
		} else {
			// not cacheable, just silently proxy
			return HTTP.request(request.url);
		}
	});
}

/**
 * The application to respond with if the request corresponds to 
 * something that could be cached
 */
Proxy.prototype._appCacheable = function(request, cacheFile) {
	var self = this;
	return cacheFile.getReader()
	.then(function() {
		return Apps.file(request, cacheFile.getPath());
	}).fail(function(err) {
		// if there's no cache yet
		if (err.code == 'ENOENT') {
			return self._appCacheFromUpstream(request, cacheFile);
		} else {
			throw err;
		}
	});
}

/**
 * Grab something from upstream that doesn't have any cache yet
 */
Proxy.prototype._appCacheFromUpstream = function(request, cacheFile) {
	var cacheWriter;

	return cacheFile.getWriter()
	.then(function(w) {
		cacheWriter = w;
		return HTTP.request(request.url);
	}).then(function(upstreamResponse) {
		var chunks = [];
		upstreamResponse.body.forEach(function(chunk) {
			cacheWriter.write(chunk);
			chunks.push(chunk);
		});

		// TODO: currently pushing entire file in to memory and transmitting
		// should stream both to disk and to the client
		return Apps.content(chunks);
	});
}

/**
 * Start the proxy listening
 */
Proxy.prototype.listen = function() {
	var self = this;

	if (this._listening) return Q();

	return this._server.listen()
	.then(function() {
		self._listening = true;
	});
}

/**
 * Expose the underlying address function
 */
Proxy.prototype.address = function() {
	return this._server.address();
}

/**
 * Expose addRepo() of RepoManager so that it can be
 * configured directly
 */
Proxy.prototype.addRepo = function(repo) {
	this._repoManager.addRepo(repo);
}
