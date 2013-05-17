var Q = require('q');
var HTTP = require('q-io/http');
var Apps = require("q-io/http-apps");
var Reader = require("q-io/reader");
var util = require('util');
var Events = require('events');
var _ = require('underscore');
var Cacher = require('./cacher');

function Proxy(opts) {
	this._listening = false;

	var self = this;
	this._server = HTTP.Server(function(request) {
		return self.application(request);
	});

	this._cacheDir = opts.cacheDir;
	this._port = opts.port || null;

	this._cacher = new Cacher(opts);

	this._active = {};
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
	this.normaliseRequest(request);
	this.log("Incomming request for: " + request.url);
	var self = this;

	return this._cacher.getCacheFile(request.url)
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
 * We seem to get corrupted requests through when acting as a proxy
 * this just triest to fix them back up
 */
Proxy.prototype.normaliseRequest = function(request) {
	if (request.path.match(/^http:\/\//))
		request.url = request.path;
}

/**
 * The application to respond with if the request corresponds to 
 * something that could be cached
 */
Proxy.prototype._appCacheable = function(request, cacheFile) {
	var self = this;

	// either we're the first one in
	if (!this._active[request.url]) {
		this._active[request.url] = cacheFile;
	} else {
		// or we should collapse this request
		return this._appCollapse(request, this._active[request.url]);
	}

	return cacheFile.expired()
	.then(function(expired) {
		if (!expired) {
			return cacheFile.getReader()
			.then(function(reader) {
				self.log("Returning cached file for: " + request.url);
				return Apps.ok(reader);
			});
		} else {
			return self._appCacheFromUpstream(request, cacheFile);
		}
	}).finally(function() {
		delete self._active[request.url];
	});
}

/**
 * We're attaching to a cacheable request that is already being downloaded by
 * another client
 */
Proxy.prototype._appCollapse = function(request, cacheFile) {
	this.log("Collapsing: " + request.url);
	return cacheFile.getReader()
	.then(function(reader) {
		return Apps.ok(reader);
	});
}

/**
 * Grab something from upstream that doesn't have any cache yet and store it
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
		}).then(function() {
			return cacheWriter.close();
		});
	}).then(function() {
		return cacheFile.save();
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
