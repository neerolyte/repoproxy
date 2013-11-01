###
A q-io FS Writer for a file, that can be read from concurrently
by multiple clients
###
describe "ReadableFileWriter", ->
  Fixture = require("../fixture")
  expect = Fixture.expect
  cacheDir = Fixture.cacheDir
  FS = require("q-io/fs")
  Q = require("q")
  ReadableFileWriter = require(Fixture.LIB_DIR + "/readableFileWriter")
  beforeEach ->
    FS.isDirectory(cacheDir).then((isDir) ->
      FS.removeTree cacheDir  if isDir
    ).then ->
      FS.makeTree cacheDir

  afterEach ->
    FS.isDirectory(cacheDir).then (isDir) ->
      FS.removeTree cacheDir  if isDir

  it "writes to a file normally", ->
    writer = undefined
    ReadableFileWriter.create(cacheDir + "/foo").then((w) ->
      writer = w
    ).then(->
      writer.write "bar"
    ).then(->
      writer.close()
    ).then ->
      expect(FS.read(cacheDir + "/foo")).to.become "bar"

  describe "WriterReader forEach()", ->
    it "can be queued before writing starts", ->
      writer = undefined
      reader = undefined
      content = ""
      readerWait = undefined
      ReadableFileWriter.create(cacheDir + "/foo").then((w) ->
        writer = w
        writer.getReader()
      ).then((r) ->
        reader = r
        readerWait = reader.forEach((chunk) ->
          content += chunk.toString("utf-8")
        )
        writer.write "foo"
      ).then(->
        Q.all [
          writer.close()
          readerWait
        ]
      ).then ->
        expect(content).to.equal "foo"

    it "gets content before writer completes", ->
      writer = undefined
      reader = undefined
      content = ""
      readerWaitDeferred = Q.defer()
      ReadableFileWriter.create(cacheDir + "/foo").then((w) ->
        writer = w
        writer.getReader()
      ).then((reader) ->
        reader.forEach (chunk) ->
          content += chunk.toString("utf-8")
          readerWaitDeferred.resolve()
        writer.write "foo"
      ).then(->
        readerWaitDeferred.promise
      ).then ->
        expect(content).to.equal "foo"

    it "catches up", ->
      writer = undefined
      reader = undefined
      content = ""
      readerWaitDeferred = Q.defer()
      ReadableFileWriter.create(cacheDir + "/foo").then((w) ->
        writer = w
        writer.write "foo"
      ).then(->
        writer.getReader()
      ).then((r) ->
        reader = r
        reader.forEach (chunk) ->
          content += chunk.toString("utf-8")
          readerWaitDeferred.resolve()
        readerWaitDeferred.promise
      ).then ->
        expect(content).to.equal "foo"

  describe "move()", ->
    it "actually moves the file", ->
      writer = undefined
      ReadableFileWriter.create(cacheDir + "/foo").then((w) ->
        writer = w
        writer.close()
      ).then(->
        writer.move cacheDir + "/bar"
      ).then ->
        expect(FS.isFile(cacheDir + "/bar")).to.become true
