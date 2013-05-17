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

# TODOs

 * Cache does not yet expire and it'll definitely cache stuff you don't want.
 * no test to ensure critical headers remain valid (i.e. Content-type)
 * new files need to start returning immediately
