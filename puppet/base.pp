# -*- mode: puppet -*-

# Here's how you generate a keyring file to put in your puppet fileserver and
# reference with a puppet:///path/to/foo.gpg:
#
#     gpg --no-default-keyring --keyserver keyserver.ubuntu.com --keyring /path/to/fileserver/foo.gpg --recv-keys DEADBEEF
define apt::source ($url, $release = '', $component = 'main', $type = 'deb', $keyring = '') {
  if $release == '' {
    $release = $::lsbdistcodename
  }
  file { "/etc/apt/sources.list.d/${name}.list":
    content => "# This file is managed by puppet\n\n${type} ${url} ${release} ${component}\n",
    notify => Exec['refresh_apt'],
  }
  if $keyring != '' {
    file { "/etc/apt/trusted.gpg.d/${name}.gpg":
      source => $keyring,
      notify => Exec['refresh_apt'],
    }
  }
  exec { "refresh_apt_immediately_for_apt_source":
	command => '/usr/bin/apt-get update && sleep 1'
  }
}
exec { 'refresh_apt':
  command => '/usr/bin/apt-get update && sleep 1',
  refreshonly => true,
}

# default to installing latest version of anything specified in a package block
Package { ensure => "latest" }

# install nodejs ppa from chris lea
apt::source { "chris-lea-node-js":
  url => "http://ppa.launchpad.net/chris-lea/node.js/ubuntu",
  keyring => "/vagrant/puppet/files/chris-lea.gpg",
  release => "quantal" # too old in lucid
}
package { ["nodejs"]: require => Apt::Source['chris-lea-node-js'] } # TODO: how can we force this to wait for apt to refresh? - https://forge.puppetlabs.com/puppetlabs/apt
package { ["npm"]: ensure => purged } # conflicts with one in nodejs as of ~v0.8

# c++ required to compile some npm modules
package { "g++": }

# get rid of broken vagrant ruby installation
file { "/opt/vagrant_ruby":
  ensure => absent,
  recurse => true,
  force => true,
}

# Autotesting
package { ["make", "ruby1.9.1-dev"]: }
package { ["guard", "guard-jasmine-node"]:
  provider => "gem",
  require => [ Package["make"], Package["ruby1.9.1-dev"] ],
}

# random tools I like to have handy
package { ["strace", "vim"]: }
