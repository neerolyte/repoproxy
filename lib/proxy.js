var util = require("util");
var http = require("http");
var filters; try { filters = require("../filters"); } catch(e) {}

exports.createServer = function(options, requestListener) {
	var proxytype;
	if (options.type) {
		try {
			proxytype = require('./'+options.type+'Proxy').Server;
		} catch(e) {
			throw "Failed to load proxy type: " + options.type +
				"\n" + e;
		}
	} else {
		proxytype = require('./reverseProxy').Server;
	}

	return new proxytype(options, requestListener);
}

// Abstract Proxy server
function Server(options, requestListener) {
	throw "Attempted to instantiate abstract ProxyServer";
}
util.inherits(Server, http.Server);
exports.Server = Server;
