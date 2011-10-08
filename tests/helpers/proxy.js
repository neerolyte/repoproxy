/**
 * A reverse proxy pointed at helpers/webserver.js that the unit tests
 * can make requests to.
 */
var conf = require('./config.js')

var util = require('util');
var http_proxy = require('../../lib/proxy')
var fs = require('fs')

var proxy = http_proxy.createServer(
	{
		"listen": {
			"hostname": '127.0.0.1',
			"port": conf.ports.proxy
		},
		"proxy": {
			"name": "node-proxy",
			"origins": [
				{
					"host": '127.0.0.1',
					"port": conf.ports.webserver
				}
			]
		},
		"cache": {
			"memory": {
				"maxitems": 1000000,
				"maxmem": 128,
				// TODO: if cleanup is > 0 then it does a setInterval that is not closed by proxy.close()... this is probably a bug
				"cleanup": 0,
				"stats": 0
			},
			"disk": {
				"path": "cache"
			},
			"stats": 0
		},
		"accesslog": {
			"path": "access_log"
		}
	}
);

proxy.listen(conf.ports.proxy, '127.0.0.1', function() {});
