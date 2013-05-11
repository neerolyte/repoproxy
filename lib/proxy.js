var Q = require('q');
var HTTP = require('q-io/http');
var Apps = require("q-io/http-apps");
var util = require('util');
var RepoManager = require('./repoManager');

function Proxy() {
	this._listening = false;

	var self = this;
	this._server = HTTP.Server(function(request) {
		return self.application(request);
	});

	this._repoManager = new RepoManager();
};
module.exports = Proxy;

/**
 * The q-io/http application function
 *
 * This is the entry point in to the proxy, a request comes in,
 * a response goes out.
 */
Proxy.prototype.application = function(request) {
	return this._repoManager.getCacheableFile(request.url)
	.then(function(file) {
		if (file) {
			throw new Error("TODO");
		} else {
			// just proxy it normally
			return HTTP.request(request.url);
		}
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
