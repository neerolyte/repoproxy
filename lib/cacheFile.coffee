###
A cacheable file is a representation of a URL that should be cacheable
it can be requested for the actual cache entry (which may not exist)
and it can be told to update the actual file, the consumer of cacheable
file need not know where the file is actually stored.
###

###
Create the cacheable file

@param cacheDir - the directory containing all repository cache
@param file - the file we want relative to the cacheDir
###
CacheFile = (cacheDir, file) ->
  @_cacheDir = cacheDir
  @_file = file
  @_writer = null

Q = require("q")
FS = require("q-io/fs")
Reader = require("q-io/reader")
Path = require("path")
moment = require("moment")
util = require("util")
Events = require("events")
_ = require("underscore")
ReadableFileWriter = require("./readableFileWriter")
module.exports = CacheFile

CacheFile::exists = ->
  Q.all([
    FS.exists(@getPath())
    FS.exists(@getPath("meta"))
  ]).then (res) ->
    res[0] and res[1]

CacheFile::getPath = (type) ->
  type = "data"  unless type
  @_cacheDir + "/" + type + "/" + @_file

CacheFile::getMeta = ->
  path = @getPath("meta")
  FS.isFile(path).then (isFile) ->
    if isFile
      FS.read(path).then (contents) ->
        try
          return JSON.parse(contents)
        catch e
          return {}
    else
      Q()


###
Once a file has been written out it should be saved with optional
cache metadata
###
CacheFile::save = (meta) ->
  self = this
  meta = {}  unless meta
  meta.expiry = meta.expiry or moment().add("minutes", 30)
  Q.all([
    @makeTree("data")
    @makeTree("meta")
    @makeTree("temp-meta")
  ]).then(->
    FS.write self.getPath("temp-meta"), JSON.stringify(meta)
  ).then(->
    Q.all [
      FS.isFile(self.getPath("data"))
      FS.isFile(self.getPath("meta"))
    ]
  ).then((files) ->
    proms = []
    proms.push FS.remove(self.getPath("data"))  if files[0]
    proms.push FS.remove(self.getPath("meta"))  if files[1]
    Q.all proms
  ).then(->
    self._writer.move self.getPath("data")
  ).then ->
    self._writer = null
    FS.move self.getPath("temp-meta"), self.getPath("meta")


CacheFile::makeTree = (type) ->
  type = "data"  unless type
  dir = Path.dirname(@getPath(type))
  FS.makeTree dir


###
Check simple metadata for whether it's expired or not
###
CacheFile::expired = ->
  @getMeta().then (meta) ->
    not meta or not meta.expiry or moment(meta.expiry) < moment()



###
Purge all data on this file
###
CacheFile::purge = ->
  self = this
  Q.all([
    FS.isFile(self.getPath("data"))
    FS.isFile(self.getPath("meta"))
  ]).then (files) ->
    proms = []
    proms.push FS.remove(self.getPath("data"))  if files[0]
    proms.push FS.remove(self.getPath("meta"))  if files[1]
    Q.all proms

###
Sets up a stream writer for a given cachefile

The writer will send data to disk + any readers
that are already attached or become attached
###
CacheFile::getWriter = ->
  
  # if we already have the writer return it
  return Q(@_writer)  if @_writer
  
  # other wise if we haven't started getting it, start getting it
  @_gettingWriter = @_getNewWriter()  unless @_gettingWriter
  
  # return the promise for the new one
  @_gettingWriter


###
Ensure there's only one writer per cachefile
###
CacheFile::_getNewWriter = ->
  self = this
  @makeTree("temp-data").then(->
    ReadableFileWriter.create self.getPath("temp-data")
  ).then (writer) ->
    self._writer = writer

###
Get a stream reader
###
CacheFile::getReader = ->
  self = this
  @expired().then (expired) ->
    unless expired
      FS.open self.getPath(),
        flags: "rb"

    else
      self.getWriter().then (writer) ->
        writer.getReader()


