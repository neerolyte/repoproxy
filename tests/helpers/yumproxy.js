/**
 * A yum proxy pointed at helpers/webserver.js that the unit tests
 * can make requests to.
 */
var conf = require('./config.js')

var util = require('util');
var http_proxy = require('../../lib/proxy')
var fs = require('fs')

var proxy = http_proxy.createServer(
	{
		"name": "node-proxy",
		"type": "yum",
		"repos": [
			{
				"url": 'http://127.0.0.1:' + conf.ports.webserver + '/yum'
			}
		],
		"accesslog": {
			"path": "helpers/access_log"
		}
	}
);

proxy.listen(conf.ports.yumproxy, '127.0.0.1', function() {});
