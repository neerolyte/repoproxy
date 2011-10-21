var util = require('util');

exports.createLogger = function() {
	return new Logger();
};

function Logger() {
}

Logger.prototype.enabled = true;

Logger.prototype.message = function(msg) {
	if (this.enabled) util.log(msg);
};

Logger.prototype.access = function(msg) {
	this.message('ACCESS: ' + msg);
};

Logger.prototype.debug = function(msg) {
	this.message('DEBUG: ' + msg);
};

Logger.prototype.error = function(msg) {
	this.message('ERROR: ' + msg);
};

Logger.prototype.disable = function() {
	this.enabled = false;
};
