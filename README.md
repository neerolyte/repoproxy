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

# TODOs

 * Header passthrough
 * Freshness Validation
  * Last-Modified -> If-Modified-Since
  * Etag -> If-None-Match
 * Pragma and Cache-Control
