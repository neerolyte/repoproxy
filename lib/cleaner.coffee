
FS = require('q-io/fs')
Q = require('q')
CacheFile = require('./cacheFile')
FindIt = require('findit')

Q.linearise = (promises) ->
	result = Q.resolve()
	result = result.then(f) for f in promises
	result

class Cleaner
	constructor: (@opts) ->
		@cacheDir = @opts.cacheDir
		@dataDir = @cacheDir + '/data'
		@active = 0
		@ended = false

	clean: ->
		self = this
		FS.isDirectory(@dataDir)
		.then((isDir) -> 
			if isDir then self.cleanDataDir()
		)

	cleanDataDir: () ->
		self = this
		deferred = Q.defer()
		finder = FindIt.find(@dataDir)

		finder.on('file', (file) ->
			self.active++
			self.cleanDataFile(file)
			.then(->
				self.active--
				if (self.active == 0 && self.ended)
					deferred.resolve()
			)
		)

		finder.on('end', ->
			self.ended = true
			if (self.active == 0)
				deferred.resolve()
		)

		deferred.promise

	cleanDataFile: (file) ->
		cacheFile = new CacheFile(
			@cacheDir, FS.relativeFromDirectory(@dataDir, file)
		)
		cacheFile.expired().then((expired) ->
			if expired then cacheFile.purge()
		)

module.exports = Cleaner
