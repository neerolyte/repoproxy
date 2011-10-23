/**
 * Like any other repo,
 * just not quite as smart.
 *
 * Primarily for unit testing.
 */
var util = require('util');
var repo = require('./repo');

function RepoDummy(options) {
	repo.Repo.call(this, options);
}
util.inherits(RepoDummy, repo.Repo);
module.exports.Repo = RepoDummy;