var Q = require('q');
var HTTP = require('q-io/http');
var Apps = require("q-io/http-apps");
var Reader = require("q-io/reader");
var util = require('util');
var RepoManager = require('./repoManager');
var Events = require('events');
var _ = require('underscore');

function Proxy(opts) {
	this._listening = false;

	var self = this;
	this._server = HTTP.Server(function(request) {
		return self.application(request);
	});

	this._cacheDir = opts.cacheDir;
	this._port = opts.port || null;

	this._repoManager = new RepoManager({ cacheDir: this._cacheDir });

	if (opts.repos) {
		_.each(opts.repos, function(repo) {
			this.addRepo(repo);
		}, this);
	}
};
util.inherits(Proxy, Events.EventEmitter);
module.exports = Proxy;

/**
 * The q-io/http application function
 *
 * This is the entry point in to the proxy, a request comes in,
 * a response goes out.
 */
Proxy.prototype.application = function(request) {
	this.log("Incomming request for: " + request.url);
	var self = this;
	return this._repoManager.getCacheFile(request.url)
	.then(function(cacheFile) {
		if (cacheFile) {
			return self._appCacheable(request, cacheFile);
		} else {
			// not cacheable, just silently proxy
			self.log("Silently proxying: " + request.url);
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
		self.log("Returning cached file for: " + request.url);
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
	this.log("Fetching from upstream: " + request.url);

	return cacheFile.getWriter()
	.then(function(w) {
		cacheWriter = w;
		return HTTP.request(request.url);
	}).then(function(upstreamResponse) {
		return upstreamResponse.body.forEach(function(chunk) {
			cacheWriter.write(chunk);
		});
	}).then(function() {
		// spool out from file that's being written to on the line above
		return Apps.file(request, cacheFile.getPath());
	});
}

/**
 * Start the proxy listening
 */
Proxy.prototype.listen = function() {
	var self = this;

	if (this._listening) return Q();

	return this._server.listen(this._port)
	.then(function() {
		self._listening = true;
		self.log('Listening on port '+self.address().port);
	});
}

/**
 * A basic logger that exports the messages out over event emitter
 */
Proxy.prototype.log = function(message) {
	this.emit("log", message);
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
