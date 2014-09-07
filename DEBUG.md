Install node-inspector

	# npm install -g node-inspector

Run the debugger

	# node-debug --no-debug-brk ./repoproxy.js

Then point a browser at port 8080 on the host running the proxy


Do produce the local time in an appropriate format for comparison to the metadata, use

	# date -u '+%Y-%m-%dT%H:%M:%S.%03NZ'


