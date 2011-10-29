/**
 * Like any other repo, just not quite as smart.
 *
 * Primarily for unit testing.
 */
var util = require('util');
var repo = require('./repo');
var path = require('path');

function RepoApt(options) {
	repo.Repo.call(this, options);
}
util.inherits(RepoApt, repo.Repo);
module.exports.Repo = RepoApt;

/**
 * Index the contents of an Apt Release file
 *
 * @param releasePath where the Release file is located relatively to the repo
 * @param str contents of Release file
 */
RepoApt.prototype.indexRelease = function(releasePath, str) {
	// scan through string until we find a line that exactly matches 'MD5Sum:'
	// then treat every line that's indented as a file line
	// when indenting stops, return
	// TODO: convert from ham-fisted string manipulation, to stream parsing
	var lines = str.split('\n');
	var inFileSection = false;
	var prefix = path.dirname(releasePath) + '/';

	for (var i in lines) {
		var line = lines[i];
		if (inFileSection) {
			if (line[0] == ' ') {
				this.addFile(prefix + line.split(/ +/).pop());
			} else {
				return;
			}
		} else {
			inFileSection = line == 'MD5Sum:';
		}
	}
};