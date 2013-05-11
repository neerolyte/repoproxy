describe('Proxy', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');
	var Q = require('q');
	var HTTP = require('q-io/http');
	var sinon = require('sinon');

	var nock = require('nock');
	var Proxy = require(LIB_DIR + '/proxy.js');

	it("should silently pass on unknown URLs", function() {
		var scope = nock('http://example.com')
			.get('/').reply(200, 'foo');

		var proxy = new Proxy();

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
		var proxy = new Proxy();

		beforeEach(function() {
			proxy.addRepo({
				name: "example",
				prefixes: [ "http://example.com/" ],
			});
			return proxy.listen();
		});
		afterEach(function() {
		});

		it("caches a request", function() {
			return; // TODO: requires the cacheable file representation to work
			var scope = nock('http://example.com')
				.get('/').reply(200, 'foo');

			var proxy = new Proxy();

			sinon.spy(proxy, 'application');

			var doRequest = function() {
				return HTTP.request({
					port: proxy.address().port,
					host: '127.0.0.1',
					headers: {
						host: 'example.com',
					},
				});
			};

			return proxy.listen()
			.then(doRequest) // do the request twice, the second should come out of cache
			.then(doRequest)
			.then(function(res) {
				return res.body.read();
			}).then(function(body) {
				expect(body.toString('utf-8')).to.equal('foo');
				expect(proxy.application.calledOnce).to.be.true;
			});
		});
	});
});
