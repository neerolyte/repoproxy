###
The Proxy is the interface from the network in to repoproxy
###
describe "Proxy", ->
  Fixture = require("../fixture")
  expect = Fixture.expect
  util = require("util")
  Q = require("q")
  HTTP = require("q-io/http")
  sinon = require("sinon")
  FS = require("q-io/fs")
  cacheDir = Fixture.cacheDir
  moment = require("moment")
  nock = require("nock")
  Proxy = require(Fixture.LIB_DIR + "/proxy")

  it "silently passes on unknown URLs", ->
    scope = nock("http://example.com").get("/").reply(200, "foo")
    proxy = new Proxy(cacheDir: cacheDir)
    sinon.spy proxy, "application"
    proxy.listen().then(->
      HTTP.request
        port: proxy.address().port
        host: "127.0.0.1"
        headers:
          host: "example.com"
    ).then((res) ->
      res.body.read()
    ).then (body) ->
      expect(body.toString("utf-8")).to.equal "foo"
      expect(proxy.application.calledOnce).to.be.true

  it "catches low level HTTP errors", ->
    res = null
    proxy = new Proxy(cacheDir: cacheDir)
    proxy.listen().then(->
      HTTP.request
        port: proxy.address().port
        host: "127.0.0.1"
        headers:
          host: "0.0.0.0" # guaranteed to fail
    ).then((r) ->
      res = r
      res.body.read()
    ).then (body) ->
      expect(body.toString("utf-8")).to.match(/ECONNREFUSED/)
      expect(res.status).to.not.equal 200

  describe "when there is some cache configuration", ->
    proxy = undefined
    beforeEach ->
      proxy = new Proxy(
        cacheDir: cacheDir
        hosts: ["example.com"]
      )
      FS.isDirectory(cacheDir).then((isDir) ->
        FS.removeTree cacheDir  if isDir
      ).then ->
        proxy.listen()


    afterEach ->
      FS.isDirectory(cacheDir).then (isDir) ->
        FS.removeTree cacheDir  if isDir


    it "caches a request", ->
      scope = nock("http://example.com").get("/foo").reply(200, "bar")
      sinon.spy proxy, "application"
      proxy.listen().then(->
        HTTP.request
          port: proxy.address().port
          host: "127.0.0.1"
          headers:
            host: "example.com"

          path: "/foo"

      ).then((res) ->
        res.body.read()
      ).then((body) ->
        expect(body.toString("utf-8")).to.equal "bar"
        expect(proxy.application.calledOnce).to.be.true
      ).then(->
        Q.all proxy._active
      ).then ->
        expect(FS.read(cacheDir + "/data/example.com/foo")).to.become "bar"


    it "caches a deep request", ->
      scope = nock("http://example.com").get("/foo/bar/baz").reply(200, "foo")
      sinon.spy proxy, "application"
      proxy.listen().then(->
        HTTP.request
          port: proxy.address().port
          host: "127.0.0.1"
          headers:
            host: "example.com"

          path: "/foo/bar/baz"

      ).then((res) ->
        res.body.read()
      ).then((body) ->
        expect(body.toString("utf-8")).to.equal "foo"
        expect(proxy.application.calledOnce).to.be.true
        Q.all proxy._active
      ).then ->
        expect(FS.read(cacheDir + "/data/example.com/foo/bar/baz")).to.become "foo"


    it "copes with a directory", ->
      scope = nock("http://example.com").get("/foo/bar/").reply(200, "foo")
      sinon.spy proxy, "application"
      proxy.listen().then(->
        HTTP.request
          port: proxy.address().port
          host: "127.0.0.1"
          headers:
            host: "example.com"

          path: "/foo/bar/"

      ).then((res) ->
        res.body.read()
      ).then (body) ->
        expect(body.toString("utf-8")).to.equal "foo"
        expect(proxy.application.calledOnce).to.be.true


    it "returns a cached request", ->
      Q.all([
        FS.makeTree(cacheDir + "/data/example.com")
        FS.makeTree(cacheDir + "/meta/example.com")
      ]).then(->
        Q.all [
          FS.write(cacheDir + "/data/example.com/foo", "bar")
          FS.write(cacheDir + "/meta/example.com/foo", JSON.stringify(expiry: moment().add("hours", 1)))
        ]
      ).then(->
        proxy.listen()
      ).then(->
        HTTP.request
          port: proxy.address().port
          host: "127.0.0.1"
          headers:
            host: "example.com"

          path: "/foo"

      ).then((res) ->
        res.body.read()
      ).then (body) ->
        expect(body.toString("utf-8")).to.equal "bar"



  describe "normalising request urls", ->
    it "can cope with nested http:// in path/url", ->
      
      # this is what happens if you do
      # http_proxy="..." curl ...
      req =
        path: "http://example.com/"
        url: "http://example.com/http://example.com/"

      Proxy::normaliseRequest req
      expect(req.url).to.equal "http://example.com/"

# vim: sw=2 ts=2 et
