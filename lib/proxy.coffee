Proxy = (opts) ->
  @_listening = false
  self = this
  @_server = HTTP.Server((request) ->
    self.application request
  )
  @_cacheDir = opts.cacheDir
  @_port = opts.port or null
  @_cacher = new Cacher(opts)
  @_collapsible = {}
  @_active = []
  this

Q = require("q")
HTTP = require("q-io/http")
Apps = require("q-io/http-apps")
Reader = require("q-io/reader")
util = require("util")
Events = require("events")
_ = require("underscore")
Cacher = require("./cacher")
util.inherits Proxy, Events.EventEmitter
module.exports = Proxy

###
The q-io/http application function

This is the entry point in to the proxy, a request comes in,
a response goes out.
###
Proxy::application = (request) ->
  @normaliseRequest request
  @log "Incomming request for: " + request.url
  self = this
  @_cacher.getCacheFile(request.url).then (cacheFile) ->
    if cacheFile
      self._appCacheable request, cacheFile
    else
      
      # not cacheable, just silently proxy
      self.log "Silently proxying: " + request.url
      HTTP.request request.url



###
We seem to get corrupted requests through when acting as a proxy
this just triest to fix them back up
###
Proxy::normaliseRequest = (request) ->
  request.url = request.path  if request.path.match(/^http:\/\//)


###
The application to respond with if the request corresponds to
something that could be cached
###
Proxy::_appCacheable = (request, cacheFile) ->
  self = this
  
  # either we're the first one in
  unless @_collapsible[request.url]
    @_collapsible[request.url] = cacheFile
  else
    
    # or we should collapse this request
    return @_appCollapse(request, @_collapsible[request.url])
  cacheFile.expired().then (expired) ->
    unless expired
      cacheFile.getReader().then (reader) ->
        self.log "Returning cached file for: " + request.url
        Apps.ok reader

    else
      self._appCacheFromUpstream request, cacheFile



###
We're attaching to a cacheable request that is already being downloaded by
another client
###
Proxy::_appCollapse = (request, cacheFile) ->
  @log "Collapsing: " + request.url
  cacheFile.getReader().then (reader) ->
    Apps.ok reader



###
Grab something from upstream that doesn't have any cache yet and store it
###
Proxy::_appCacheFromUpstream = (request, cacheFile) ->
  cacheWriter = undefined
  @log "Fetching from upstream: " + request.url
  appProm = undefined
  reader = undefined
  self = this
  Q.all([cacheFile.getWriter(), cacheFile.getReader()]).then (res) ->
    cacheWriter = res[0]
    reader = res[1]
    req = HTTP.request(request.url).then((upstreamResponse) ->
      upstreamResponse.body.forEach((chunk) ->
        cacheWriter.write chunk
      ).then ->
        cacheWriter.close()

    ).then(->
      cacheFile.save()
    ).finally(->
      delete self._collapsible[request.url]

      self._removeCompletedRequests()
    )
    self._active.push req
    Apps.ok reader


Proxy::_removeCompletedRequests = ->
  @_active = _.reject(@_active, (req) ->
    req.isFulfilled()
  )


###
Start the proxy listening
###
Proxy::listen = ->
  self = this
  return Q()  if @_listening
  @_server.listen(@_port).then ->
    self._listening = true
    self.log "Listening on port " + self.address().port



###
A basic logger that exports the messages out over event emitter
###
Proxy::log = (message) ->
  @emit "log", message


###
Expose the underlying address function
###
Proxy::address = ->
  @_server.address()
