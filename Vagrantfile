# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant::Config.run do |config|
  config.vm.box = "precise32"
  config.vm.box_url = "http://files.vagrantup.com/precise32.box"

  config.vm.network :hostonly, "192.168.33.11"

  config.vm.host_name = "repoproxy.dev"
  
  config.vm.provision :shell, :inline => "/vagrant/puppet/bootstrap"

  config.vm.provision :puppet do |puppet|
    puppet.manifests_path = "puppet"
    puppet.manifest_file  = "base.pp"
  end
  
  config.vm.provision :shell, :inline => "cd /vagrant/ && npm update"

  config.vm.share_folder("v-root", "/vagrant", ".")

  # Allow symlinks in the Vagrant guest.
  # We seem to need symlinks for npm to work.
  # https://github.com/mitchellh/vagrant/issues/713#issuecomment-4416384
  config.vm.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
end
