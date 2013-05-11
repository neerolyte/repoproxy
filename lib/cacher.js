var Q = require('q');
var CacheFile = require('./cacheFile.js');

function Cacher(opts) {
	this._cacheDir = opts.cacheDir;
};
module.exports = Cacher;

Cacher.prototype.getCacheFile = function(path) {
	return Q(new CacheFile(this._cacheDir, path));
}
