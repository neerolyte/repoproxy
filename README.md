# repoproxy

## About

repoproxy is a caching web proxy that caches Linux repositories for multiple client nodes. As items are cached they gradually create a mirror of the upstream repos.

The main differences between this approach and regular mirroring approaches is that repoproxy will:

 * only mirror what you need
 * store its cache in the same layout as the upstream repo
 * make caching yum again
 * one day be apt

It started life as [node-proxy](https://github.com/dansimau/node-proxy).

## Features/Limitations

You can get a feel for the limitations or request new features on the [issue tracker](https://github.com/neerolyte/node-proxy/issues).
