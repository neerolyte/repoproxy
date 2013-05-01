var fs = require('fs');
var Q = require('q');

function Cacher() {
};
module.exports = Cacher;

/**
 * get a write stream for a given cache path
 */
Cacher.prototype.createWriteStream = function(path) {
	return fs.createWriteStream(path);
}

/**
 * get a read stream for a given cache path
 * returns a promise that will resolve to false
 * if there is no valid cache for the given path
 */
Cacher.prototype.createReadStream = function(path) {
	return Q(false);
}
