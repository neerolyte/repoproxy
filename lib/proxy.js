var util = require("util");
var http = require("http");
var cache = require("./cache");
var fs = require("fs");
var proxyUtils = require("./utils");

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

	// TODO: make following code sighted
	// blindly assume req exactly specifies the file
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
	throw new Error('I really should write some code here.');
};

RepoRequest.prototype.getStorePath = function() {
	return this.server.getStorePath(this.clientReq);
};



function refreshHandler(req, res) {
	self = this;
	// response object is optional - only exists if a client is waiting on a response from the
	// upstream request (because the item wasn't in the cache at all)
	if (typeof(res) === 'undefined') res = null;

	var options = {
		host: self.options.origins[0].host,
		port: self.options.origins[0].port,
		method: req.method,
		path: req.url,
		headers: req.headers
	};

	var upstreamReq = http.request(options, function(upstreamRes) {
		upstreamResponseHandler(upstreamRes, req, res);
	});

	req.addListener('data', function(chunk) {
		upstreamReq.write(chunk, 'binary');
	});
	req.addListener('end', function() {
		req._proxyMeta.dateEnd = new Date();
		upstreamReq.end();
	});
	req.addListener('error', function(err) {
		res.writeHead(500, {
			'content-type': 'text/plain',
			'content-length': err.message.length
		});
		res.end(err.message);
	});
}

exports._refreshHandler = refreshHandler;

function upstreamResponseHandler(upstreamRes, req, res) {

	req._proxyMeta.cache = {
		timestamp: proxyUtils.timestamp(),
		statusCode: upstreamRes.statusCode,
		headers: proxyUtils.copyObj(upstreamRes.headers),
		body: ''
	};

	upstreamRes.addListener('data', function(chunk) {
		req._proxyMeta.cache.body = req._proxyMeta.cache.body + chunk.toString('base64');
	});
	if (cacheable(upstreamRes)) {
		upstreamRes.addListener('end', function() {
			self.cache.set(req._proxyMeta.meta.key, JSON.stringify(req._proxyMeta.cache));
		});
	}

	if (res !== null) {
		upstreamRes.headers['age'] = '0';
		appendXcacheHeaders(upstreamRes.headers, req._proxyMeta.meta.cacheStatus);

		res.writeHead(upstreamRes.statusCode, upstreamRes.headers);

		upstreamRes.addListener('data', function(chunk) {
			res.write(chunk, 'binary');
		});
		upstreamRes.addListener('end', function() {
			res.end();
			writeLog(req);
		});
	}
}

exports._upstreamResponseHandler = upstreamResponseHandler;

function calculateMaxAge(headers) {
	if (typeof(headers['cache-control']) !== 'undefined') {
		var params = headers["cache-control"].split(',');
		for (var i=0, len=params.length; i<len; ++i ) {
			if (params[i].indexOf('max-age') > -1) {
				return params[i].split('=')[1];
			}
		}
	}
	return false;
}

exports._calculateMaxAge = calculateMaxAge;

function isExpired(cacheObjectHeaders, cacheControlHeaders) {
	// Second parameter is optional. If it's not specified, we'll assume we're checking against
	// the original origin server's cache-control headers
	if (typeof(cacheControlHeaders) === 'undefined') {
		cacheControlHeaders = cacheObjectHeaders;
	}

	var maxAge = calculateMaxAge(cacheControlHeaders);

	if (maxAge == false) {
		return false;
	} else if (cacheObjectHeaders['age'] > maxAge) {
		return true;
	} else {
		return false;
	}
}

exports._isExpired = isExpired;

function cacheable(headers) {

	if (typeof(headers["cache-control"]) !== "undefined") {
		if (headers["cache-control"].indexOf("private") > -1) {
			return false;
		} else if (headers["cache-control"].indexOf("no-cache") > -1) {
			return false;
		} else if (headers["cache-control"].indexOf("no-store") > -1) {
			return false;
		} else {
			return true;
		}
	}
	if (typeof(headers["pragma"]) !== "undefined") {
		if (headers["pragma"].indexOf("no-cache") > -1) {
			return false;
		}
	}
	// If nothing is specified, then allow stuff to be cached
	return true;
}

exports._cacheable = cacheable;


function appendHeader(key, value, headers) {
	if (typeof(headers[key]) == "undefined") {
		headers[key] = value;
	} else {
		headers[key] = headers[key] + ", " + value;
	}
}

exports._appendHeader = appendHeader;

function appendXcacheHeaders(headers, cacheMeta) {
	appendHeader('x-cache', cacheMeta.cache + ' from ' + self.options.name, headers);
	appendHeader('x-cache-lookup', cacheMeta.lookup +' from ' + self.options.name, headers);
}

exports._appendXcacheHeaders = appendXcacheHeaders;

function writeLog(req) {

	var agent, reqTime, reqUrl;

	if (typeof(req._proxyMeta.meta.cacheStatus.source) !== 'undefined') {
		req._proxyMeta.meta.cacheStatus.cache = req._proxyMeta.meta.cacheStatus.source + '_' + req._proxyMeta.meta.cacheStatus.cache;
	}

	if (typeof(req.headers["user-agent"]) === 'undefined') {
		agent = "-";
	} else {
		agent = req.headers["user-agent"];
	}

	if (typeof(req.headers["host"]) === 'undefined') {
		reqUrl = "http://" + self.options.origins[0].host + req.url;
	} else {
		reqUrl = "http://" + req.headers["host"] + req.url;
	}

//	reqTime = (req._proxyMeta.dateEnd.getTime() - req._proxyMeta.date.getTime());

	self.accesslog.write(req.connection.remoteAddress + " " +
			   "-" + " " +
			   "-" + " " +
			   "[" + formatAccessLogDate(req._proxyMeta.date) + "]" + " " +
			   "\"" + reqUrl + " HTTP/" +  req.httpVersion + "\" " +
			   req._proxyMeta.cache.statusCode + " " +
			   req._proxyMeta.cache.body.length + " " +
			   "\"-\" " +
			   "\"" + agent + "\" " +
			   req._proxyMeta.meta.cacheStatus.cache + ":" + req._proxyMeta.meta.cacheStatus.lookup + " " +
			   "\"-\"" +
			   "\n", 'utf8');
}

exports._writeLog = writeLog;

function formatAccessLogDate(date) {
	return ("0" + date.getDate()).slice(-2) + "/" +
	       months[date.getMonth()] + "/" +
	       date.getFullYear() + ":" +
	       ("0" + date.getHours()).slice(-2) + ":" +
	       ("0" + date.getMinutes()).slice(-2) + ":" +
	       ("0" + date.getSeconds()).slice(-2) + " " +
	       "+" + (-date.getTimezoneOffset()/60*1000);
}

exports._formatAccessLogDate = formatAccessLogDate;
