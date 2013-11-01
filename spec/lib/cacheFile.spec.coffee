###
A cacheable file is a representation of a URL that should be cacheable
it can be requested for the actual cache entry (which may not exist)
and it can be told to update the actual file, the consumer of cacheable
file need not know where the file is actually stored.
###
describe "CacheFile", ->
  Fixture = require("../fixture")
  expect = Fixture.expect
  FS = require("q-io/fs")
  cacheDir = Fixture.cacheDir
  Q = require("q")
  sinon = require("sinon")
  moment = require("moment")
  util = require("util")
  CacheFile = require(Fixture.LIB_DIR + "/cacheFile")
  
  # TODO: it'd be really nice to use a rerooted fs when it gets fixed
  # https://github.com/kriskowal/q-io/pull/32
  beforeEach ->
    FS.isDirectory(cacheDir).then((isDir) ->
      FS.removeTree cacheDir  if isDir
    ).then ->
      FS.makeTree cacheDir


  afterEach ->
    FS.isDirectory(cacheDir).then (isDir) ->
      FS.removeTree cacheDir  if isDir


  describe "with no existing file", ->
    it "knows file is missing", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      expect(cacheFile.exists()).to.become false

    it "produces a writeable stream", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      cacheFile.getWriter().then((writer) ->
        writer.write("baz").then ->
          writer.close()

      ).then(->
        cacheFile.save()
      ).then ->
        expect(FS.read(cacheDir + "/data/somefile")).to.become "baz"


    it "only places data in meta/data after save() is called", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      cacheFile.getWriter().then((writer) ->
        expect(FS.isFile(cacheFile.getPath())).to.become(false).then(->
          writer.write "foo"
        ).then ->
          writer.close()

      ).then(->
        expect(FS.isFile(cacheFile.getPath())).to.become false
      ).then(->
        cacheFile.save()
      ).then ->
        expect(FS.isFile(cacheFile.getPath())).to.become true



  describe "with an existing file", ->
    beforeEach ->
      Q.all([
        FS.makeTree(cacheDir + "/data")
        FS.makeTree(cacheDir + "/meta")
      ]).then ->
        Q.all [
          FS.write(cacheDir + "/data/somefile", "foo")
          FS.write(cacheDir + "/meta/somefile", JSON.stringify(expiry: moment().add("hours", 1)))
        ]


    it "knows file exists", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      expect(cacheFile.exists()).to.become true

    it "knows it doesn't exist if meta is missing", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      FS.remove(cacheDir + "/meta/somefile").then ->
        expect(cacheFile.exists()).to.become false


    it "produces a readable stream", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      cacheFile.getReader().then((reader) ->
        reader.read()
      ).then (buf) ->
        expect(buf.toString("utf-8")).to.equal "foo"



  describe "metadata", ->
    it "stores", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      cacheFile.getWriter().then((writer) ->
        writer.write("baz").then ->
          writer.close()

      ).then(->
        cacheFile.save foo: "bar"
      ).then(->
        cacheFile.getMeta()
      ).then (meta) ->
        expect(meta.foo).to.eql "bar"


    it "recovers if metadata is corrupted", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      Q.all([
        FS.makeTree(cacheDir + "/data")
        FS.makeTree(cacheDir + "/meta")
      ]).then(->
        Q.all [
          FS.write(cacheDir + "/data/somefile", "foo")
          FS.write(cacheDir + "/meta/somefile", "bar")
        ]
      ).then(->
        expect(cacheFile.getMeta()).to.become {}
      ).then(->
        cacheFile.getWriter()
      ).then((writer) ->
        writer.write("baz").then ->
          writer.close()

      ).then(->
        cacheFile.save()
      ).then(->
        FS.read cacheDir + "/data/somefile"
      ).then (read) ->
        expect(read.toString("utf-8")).to.equal "baz"



  describe "expiry", ->
    clock = undefined
    beforeEach ->
      clock = sinon.useFakeTimers()

    afterEach ->
      clock.restore()

    it "is expired when file is missing", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      expect(cacheFile.expired()).to.become true

    it "defaults to 30 minutes", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      cacheFile.getWriter().then((writer) ->
        writer.write("foo").then ->
          writer.close()

      ).then(->
        cacheFile.save()
      ).then(->
        clock.tick 30 * 60 * 1000 - 1000
        cacheFile.expired()
      ).then((expired) ->
        expect(expired).to.equal false
        clock.tick 1001
        cacheFile.expired()
      ).then (expired) ->
        expect(expired).to.equal true


    it "can be configured", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      cacheFile.getWriter().then((writer) ->
        writer.write("foo").then ->
          writer.close()

      ).then(->
        cacheFile.save expiry: moment().add("hours", 10)
      ).then(->
        clock.tick 10 * 60 * 60 * 1000 - 1000
        cacheFile.expired()
      ).then((expired) ->
        expect(expired).to.equal false
        clock.tick 1001
        cacheFile.expired()
      ).then (expired) ->
        expect(expired).to.equal true



  describe "collapsing", ->
    it "provides a reader for a partial file", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      reader = undefined
      writer = undefined
      cacheFile.getWriter().then((w) ->
        writer = w
        cacheFile.getReader()
      ).then((r) ->
        reader = r
        writer.write "foo"
      ).then(->
        setTimeout (->
          writer.close()
        ), 10
        reader.read()
      ).then (buf) ->
        expect(buf.toString("utf-8")).to.equal "foo"


    it "still reads after save", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      reader = undefined
      writer = undefined
      cacheFile.getWriter().then((w) ->
        writer = w
        writer.write "foo"
      ).then(->
        writer.close()
      ).then(->
        cacheFile.save()
      ).then(->
        writer.getReader()
      ).then((reader) ->
        reader.read()
      ).then (read) ->
        expect(read).to.equal "foo"


    it "provides a reader before writing has even started", ->
      cacheFile = new CacheFile(cacheDir, "somefile")
      writer = undefined
      readProm = undefined
      cacheFile.getReader().then((reader) ->
        readProm = reader.read()
        cacheFile.getWriter()
      ).then((w) ->
        writer = w
        writer.write "foo"
      ).then(->
        writer.close()
      ).then(->
        readProm
      ).then (read) ->
        expect(read).to.equal "foo"




