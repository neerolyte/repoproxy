/**
 * Like any other repo, just not quite as smart.
 *
 * Primarily for unit testing.
 */
var util = require('util');
var repo = require('./repo');

function RepoDummy(options) {
	repo.Repo.call(this, options);
	this.paths = options.paths;
}
util.inherits(RepoDummy, repo.Repo);
module.exports.Repo = RepoDummy;

RepoDummy.prototype.serve = function(req) {
	req.clientRes.writeHead(
		200,
		{'Content-Type': 'text/html'}
	);
	req.clientRes.write("Welcome to your friendly dummy repo.\n");
	for (var path in this.paths) {
		var children = this.paths[path];
		console.log(util.inspect(path));
	}
	req.clientRes.end();
};
