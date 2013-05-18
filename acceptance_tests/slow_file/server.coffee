#!/usr/bin/env coffee

###
A stupid slow server that spews foo slowly down the line and then
shuts down
###

http = require('http')
_s = require('underscore.string')
fs = require('fs')

server = http.createServer (req, res) ->
	res.writeHead(200, {'Content-Type': 'text/plain'})
	sendChunk(res)

server.listen -> console.log server.address().port

sent = 0
line = _s.repeat("foo", 341) + "\n" # 1024 characters
limit = 100 # 100 KB

sendChunk = (res) ->
	res.write(line)
	sent++

	if (sent >= limit)
		res.end()
		server.close()
	else
		setTimeout ( ->
			sendChunk(res)
		), 10
