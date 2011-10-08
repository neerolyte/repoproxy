var util = require('util')
var http = require('http')

function Server(options, requestListener) {
	http.Server.call(this);

	//this.addListener('request', proxyRequestListener);
	//this.addListener('refresh', refreshHandler);

	if (requestListener) {
		this.addListener('request', requestListener);
	}

	this.options = options || {};
	//this.cache = new cache.Cache(this.options.cache);

	//this.accesslog = fs.createWriteStream(this.options.accesslog.path, {flags: 'a', encoding: 'utf8'});
}
util.inherits(
	Server, 
	require('./proxy').Server
);
exports.Server = Server;
