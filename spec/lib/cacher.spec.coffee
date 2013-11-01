describe "Cacher", ->
  Fixture = require("../fixture")
  expect = Fixture.expect
  util = require("util")
  sinon = require("sinon")
  Cacher = require(Fixture.LIB_DIR + "/cacher")
  CacheFile = require(Fixture.LIB_DIR + "/cacheFile")
  cacher = undefined
  it "should assume files are not part of a repository", ->
    cacher = new Cacher(cacheDir: Fixture.cacheDir)
    expect(cacher.getInfo("http://example.com/some-random-file.txt")).to.become()

  describe "when a host is configured", ->
    beforeEach ->
      cacher = new Cacher(
        cacheDir: Fixture.cacheDir
        hosts: ["example.com"]
      )

    it "can retrieve the cache info", ->
      expect(cacher.getInfo("http://example.com/some-file.txt").then((info) ->
        info.path
      )).to.deep.become "example.com/some-file.txt"

    it "can retrieve cache info if url has a port", ->
      expect(cacher.getInfo("http://example.com:1234/some-file.txt").then((info) ->
        info.path
      )).to.deep.become "example.com/some-file.txt"

    it "can get the cache file", ->
      expect(
        cacher.getCacheFile("http://example.com/some-file.txt")
      ).to.eventually.be.an.instanceof(CacheFile)

    it "doesn't get the cache file for uncacheable requests", ->
      expect(cacher.getCacheFile("http://example.com/foo/")).to.become()

# vim: sw=2 ts=2 et

