###
The Cleaner rumages through all your stuff, throwing out anything you don't
need any more.
###

describe('Cleaner', ->
	Fixture = require('../fixture')
	Cleaner = require(LIB_DIR + '/cleaner')
	CacheFile = require(LIB_DIR + '/cacheFile')
	FS = require('q-io/fs')
	expect = Fixture.expect
	
	cacheDir = Fixture.cacheDir
	cleaner = new Cleaner({ cacheDir: cacheDir })

	cacheDirCleanup = ->
		FS.isDirectory(cacheDir)
		.then((isDir) ->
			if (isDir) then FS.removeTree(cacheDir)
		)
	
	beforeEach(->
		cacheDirCleanup().then(->
			FS.makeTree(cacheDir)
		)
	)
	afterEach(cacheDirCleanup)

	it('cleans up invalid files', ->
		FS.makeTree(cacheDir + '/data')
		.then(->
			FS.write(cacheDir + '/data/somefile', 'foo')
		).then(->
			cleaner.clean()
		).then(->
			expect(FS.exists(cacheDir + '/data/somefile')).to.become(false)
		)
	)

	it('does not remove valid files', ->
		cacheFile = new CacheFile(cacheDir, 'somefile')

		cacheFile.getWriter()
		.then((writer) ->
			writer.write('foo').then(-> writer.close())
		).then(->
			cacheFile.save()
		).then(->
			cleaner.clean()
		).then(->
			expect(FS.exists(cacheDir + '/data/somefile')).to.become(true)
		)
	)
)
