describe('Proxy', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');
	var Q = require('q');
	var HTTP = require('q-io/http');
	var sinon = require('sinon');
	var FS = require('q-io/fs');
	var cacheDir = Fixture.cacheDir;
	var moment = require('moment');

	var nock = require('nock');
	var Proxy = require(LIB_DIR + '/proxy.js');

	it("silently passes on unknown URLs", function() {
		var scope = nock('http://example.com')
			.get('/').reply(200, 'foo');

		var proxy = new Proxy({ cacheDir: cacheDir });

		sinon.spy(proxy, 'application');

		return proxy.listen()
		.then(function() {
			return HTTP.request({
				port: proxy.address().port,
				host: '127.0.0.1',
				headers: {
					host: 'example.com',
				},
			});
		}).then(function(res) {
			return res.body.read();
		}).then(function(body) {
			expect(body.toString('utf-8')).to.equal('foo');
			expect(proxy.application.calledOnce).to.be.true;
		});
	});

	describe("when there is some cache configuration", function() {
		var proxy;

		beforeEach(function() {
			proxy = new Proxy({
				cacheDir: cacheDir,
				hosts: [ "example.com" ],
			});
			return FS.isDirectory(cacheDir)
			.then(function(isDir) {
				if (isDir) return FS.removeTree(cacheDir);
			}).then(function() {
				return proxy.listen();
			});
		});

		afterEach(function() {
			return FS.isDirectory(cacheDir)
			.then(function(isDir) {
				if (isDir) return FS.removeTree(cacheDir);
			});
		});

		it("caches a request", function() {
			var scope = nock('http://example.com')
				.get('/foo').reply(200, 'bar');

			sinon.spy(proxy, 'application');

			return proxy.listen()
			.then(function() {
				return HTTP.request({
					port: proxy.address().port,
					host: '127.0.0.1',
					headers: {
						host: 'example.com',
					},
					path: "/foo",
				});
			})
			.then(function(res) {
				return res.body.read();
			}).then(function(body) {
				expect(body.toString('utf-8')).to.equal('bar');
				expect(proxy.application.calledOnce).to.be.true;
			}).then(function() {
				return Q.all(proxy._active);
			}).then(function() {
				return expect(FS.read(cacheDir + '/data/example.com/foo')).to.become("bar");
			});
		});

		it("caches a deep request", function() {
			var scope = nock('http://example.com')
				.get('/foo/bar/baz').reply(200, 'foo');

			sinon.spy(proxy, 'application');

			return proxy.listen()
			.then(function() {
				return HTTP.request({
					port: proxy.address().port,
					host: '127.0.0.1',
					headers: {
						host: 'example.com',
					},
					path: "/foo/bar/baz",
				});
			})
			.then(function(res) {
				return res.body.read();
			}).then(function(body) {
				expect(body.toString('utf-8')).to.equal('foo');
				expect(proxy.application.calledOnce).to.be.true;
				return Q.all(proxy._active);
			}).then(function() {
				return expect(FS.read(cacheDir + '/data/example.com/foo/bar/baz')).to.become("foo");
			});
		});

		it("copes with a directory", function() {
			var scope = nock('http://example.com')
				.get('/foo/bar/').reply(200, 'foo');

			sinon.spy(proxy, 'application');

			return proxy.listen()
			.then(function() {
				return HTTP.request({
					port: proxy.address().port,
					host: '127.0.0.1',
					headers: {
						host: 'example.com',
					},
					path: "/foo/bar/",
				});
			})
			.then(function(res) {
				return res.body.read();
			}).then(function(body) {
				expect(body.toString('utf-8')).to.equal('foo');
				expect(proxy.application.calledOnce).to.be.true;
			});
		});

		it("returns a cached request", function() {
			return Q.all([
				FS.makeTree(cacheDir + '/data/example.com'),
				FS.makeTree(cacheDir + '/meta/example.com'),
			]).then(function() {
				return Q.all([
					FS.write(cacheDir + '/data/example.com/foo', 'bar'),
					FS.write(cacheDir + '/meta/example.com/foo', JSON.stringify({
						expiry: moment().add('hours', 1)
					})),
				]);
			}).then(function() {
				return proxy.listen();
			}).then(function() {
				return HTTP.request({
					port: proxy.address().port,
					host: '127.0.0.1',
					headers: {
						host: 'example.com',
					},
					path: "/foo",
				});
			})
			.then(function(res) {
				return res.body.read();
			}).then(function(body) {
				expect(body.toString('utf-8')).to.equal('bar');
			});
		});
	});

	describe("normalising request urls", function() {
		it("can cope with nested http:// in path/url", function() {
			// this is what happens if you do
			// http_proxy="..." curl ...
			var req = {
				path: 'http://example.com/',
				url: 'http://example.com/http://example.com/',
			};
			Proxy.prototype.normaliseRequest(req);

			expect(req.url).to.equal('http://example.com/');
		});
	});
});
