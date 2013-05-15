/**
 * A q-io FS Writer for a file, that can be read from concurrently
 * by multiple clients while writing is still going on
 */
var Q = require('q');
var FS = require('q-io/fs');
var BufferStream = require('q-io/buffer-stream');
var util = require('util');
var Events = require('events');

function create(file) {
	var writer = new ReadableFileWriter(file);
	return writer.open()
	.then(function() {
		return writer;
	});
}
module.exports.create = create;

function ReadableFileWriter(file) {
	this._file = file;
	this._offset = 0;
}
util.inherits(ReadableFileWriter, Events.EventEmitter);

ReadableFileWriter.prototype.open = function() {
	var self = this;

	return FS.open(this._file, { flags: "wb"})
	.then(function(writer) {
		self._writer = writer;
	});
}

ReadableFileWriter.prototype.write = function(content) {
	this._offset += content.length;
	this.emit("write", content);
	return this._writer.write(content);
}

ReadableFileWriter.prototype.close = function() {
	var self = this;
	return this._writer.close()
	.then(function() {
		self.emit("closed");
	});
}

ReadableFileWriter.prototype.getReader = function() {
	return new WriterReader(this);
}

function WriterReader(writer) {
	this._writer = writer;
	this._offset = 0;
}

WriterReader.prototype.read = function() {
	var chunks = [];

	return this.forEach(function(chunk) {
		chunks.push(chunk);
	}).then(function() {
		return chunks.join("");
	});
}

WriterReader.prototype.forEach = function(cb) {
	var self = this;

	if (this._writer._offset == this._offset) {
		return this._startLockStep(cb);
	} else {
		return this._playCatchUp(cb);
	}
}

/**
 * if we're in lock step we just feed info from the writer straight on
 * to our reader
 */
WriterReader.prototype._startLockStep = function(cb) {
	var deferred = Q.defer();
	var self = this;

	this._writer.on('write', function(chunk) {
		self._offset += chunk.length;
		cb(chunk);
	});
	this._writer.on('closed', function() {
		deferred.resolve();
	});

	return deferred.promise;
}

/**
 * We've started behind the writer so we need to play catch up and
 * try to enter lock step
 */
WriterReader.prototype._playCatchUp = function(cb) {
	var file;
	var self = this;
	return FS.open(this._writer._file, { flags: "rb" })
	.then(function(f) {
		file = f;
		return file.forEach(function(chunk) {
			self._offset += chunk.length;
			cb(chunk);
		});
	}).then(function() {
		return file.close();
	}).then(function() {
		// try entering lock step again
		self.forEach(cb);
	});
}
