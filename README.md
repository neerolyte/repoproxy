# Repoproxy

[![Build Status](https://travis-ci.org/neerolyte/repoproxy.png)](https://travis-ci.org/neerolyte/repoproxy)

I just wanted a simple mirroring proxy server for repositories.

apt-cacher is not simple enough.

# Features

 * collapsed forwarding
 * mirrors upstream repositories

# Storage layout

A simple proxy needs a simple storage layout.

Repoproxy uses two directories:

 * `data/` - copies of actual files from upstream repos
 * `meta/` - simplistic metadata about where a file came from (enabling things like IMS freshness checks)

# External References

A good caching guide: [http://www.mnot.net/cache_docs/](http://www.mnot.net/cache_docs/)

# Alternatives

I've gone through a few of the alternative proxies here to give a bit of a picture of why I felt an alternative was needed, however it's highly possible one of these is much better suited to your needs.

None of my opinions are meant to reflect on the ability of any of these proxies to do what they're designed to do.

## apt-cacher-ng

[apt-cacher-ng (or ACNG)](http://www.unix-ag.uni-kl.de/~bloch/acng/) mostly "just works" for Debian type repositories.

Issues:

 * Trying to tune for repositories that are not natively handled [requires editing massive obtuse Regular Expressions](https://bugs.launchpad.net/ubuntu/+source/apt-cacher-ng/+bug/1006844)
 * Requests for paths that don't match configured file patterns out right reject requests (meaning it can't be configured globally for the OS)

## Squid

[Squid](http://www.squid-cache.org/) is a well maintained forward and reverse caching proxy with a long history, it's highly configurable and can be coaxed in to caching package repositories with patience.

Missing features:

 * Mirroring of upstream layout (so that the cache can be converted to an actual repository)
 * non-trivial to tune by file type
 * highlighy technical configuration format (steep learning curve for newbies)

## squid-deb-proxy

[squid-deb-proxy](https://launchpad.net/squid-deb-proxy) provides a 
(theoretically) ready to get set of config around Squid to get you caching debs
immediately.

Missing features:

 * Caching non-deb files (it doesn't even cache repository metadata when it's safe to do so, e.g. when Last-Modified is set and validation is feasible)
 * All other issues with Squid

## Polipo

[Polipo](http://www.pps.univ-paris-diderot.fr/~jch/software/polipo/) looks nearly perfect.

Issues:

 * Headers are stored in the same file as the content, making extracting the cache in to a useful static repo non trivial - http://www.pps.univ-paris-diderot.fr/~jch/software/polipo/manual/Disk-format.html#Disk-format
 * Deduplication - I'd like to let the proxy server deduplicate upstream data when miss configured clients utilise different mirrors for the same repositories

# TODOs

 * Header passthrough
 * Freshness Validation
  * Last-Modified -> If-Modified-Since
  * Etag -> If-None-Match
 * Pragma and Cache-Control
 * Figure out when we get a HTTPS request and silently proxy on
 * Fix the log format
 * init script
 * deduplication
