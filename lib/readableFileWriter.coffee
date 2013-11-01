###
A q-io FS Writer for a file, that can be read from concurrently
by multiple clients while writing is still going on
###
create = (file) ->
  writer = new ReadableFileWriter(file)
  writer.open().then ->
    writer

ReadableFileWriter = (file) ->
  @_file = file
  @_offset = 0
  @closed = false
WriterReader = (writer) ->
  @_writer = writer
  @_offset = 0
Q = require("q")
FS = require("q-io/fs")
BufferStream = require("q-io/buffer-stream")
util = require("util")
Events = require("events")
module.exports.create = create
util.inherits ReadableFileWriter, Events.EventEmitter
ReadableFileWriter::open = ->
  self = this
  FS.open(@_file,
    flags: "wb"
  ).then (writer) ->
    self._writer = writer


ReadableFileWriter::write = (content) ->
  @_offset += content.length
  @emit "write", content
  @_writer.write content

ReadableFileWriter::close = ->
  self = this
  @_writer.close().then ->
    self.emit "closed"
    self.closed = true


ReadableFileWriter::move = (dest) ->
  oldPath = @_file
  @_file = dest
  FS.move oldPath, dest

ReadableFileWriter::getReader = ->
  new WriterReader(this)

WriterReader::read = ->
  chunks = []
  @forEach((chunk) ->
    chunks.push chunk
  ).then ->
    chunks.join ""


WriterReader::forEach = (cb) ->
  if @_writer._offset is @_offset
    return Q()  if @_writer.closed
    @_startLockStep cb
  else
    @_playCatchUp cb


###
if we're in lock step we just feed info from the writer straight on
to our reader
###
WriterReader::_startLockStep = (cb) ->
  return Q()  if @_writer.closed
  deferred = Q.defer()
  self = this
  @_writer.on "write", (chunk) ->
    self._offset += chunk.length
    cb chunk

  @_writer.on "closed", ->
    deferred.resolve()

  deferred.promise


###
We've started behind the writer so we need to play catch up and
try to enter lock step
###
WriterReader::_playCatchUp = (cb) ->
  file = undefined
  self = this
  FS.open(@_writer._file,
    flags: "rb"
    begin: @_offset
    end: @_writer._offset
  ).then((f) ->
    file = f
    file.forEach (chunk) ->
      self._offset += chunk.length
      cb chunk

  ).then(->
    file.close()
  ).then ->
    
    # try entering lock step again
    self.forEach cb

