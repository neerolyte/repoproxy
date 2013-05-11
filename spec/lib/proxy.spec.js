describe('Proxy', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');
	var Q = require('q');
	var HTTP = require('q-io/http');
	var sinon = require('sinon');
	var FS = require('q-io/fs');
	var cacheDir = Fixture.cacheDir;

	var nock = require('nock');
	var Proxy = require(LIB_DIR + '/proxy.js');

	it("should silently pass on unknown URLs", function() {
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

	describe("when there is a configured repo", function() {
		var proxy = new Proxy({ cacheDir: cacheDir });

		beforeEach(function() {
			proxy.addRepo({
				name: "example",
				prefixes: [ "http://example.com/" ],
			});
			return FS.isDirectory(cacheDir)
			.then(function(isDir) {
				if (isDir) return FS.removeTree(cacheDir);
			}).then(function() {
				return proxy.listen();
			});
		});
		afterEach(function() {
			return FS.removeTree(cacheDir);
		});

		it("caches a request", function() {
			var scope = nock('http://example.com')
				.get('/foo').reply(200, 'bar');

			sinon.spy(proxy, 'application');

			var doRequest = function() {
				return HTTP.request({
					port: proxy.address().port,
					host: '127.0.0.1',
					headers: {
						host: 'example.com',
					},
					path: "/foo",
				});
			};

			return proxy.listen()
			.then(doRequest)
			.then(function(res) {
				return res.body.read();
			}).then(function(body) {
				expect(body.toString('utf-8')).to.equal('bar');
				expect(proxy.application.calledOnce).to.be.true;
			}).then(function() {
				return expect(FS.read(cacheDir + '/data/example/foo')).to.become("bar");
			});
		});
	});
});