# Repoproxy

I just wanted a simple mirroring proxy server for repositories.

apt-cacher is not simple enough.

# Storage layout

A simple proxy needs a simple storage layout.

Repoproxy uses two directories:

 * `data/` - copies of actual files from upstream repos
 * `meta/` - simplistic metadata about where a file came from (enabling things like IMS freshness checks)
