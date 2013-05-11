# -*- mode: ruby -*-
# vi: set ft=ruby :

# Allow symlinks in the Vagrant guest.
# We seem to need symlinks for npm to work.
# https://github.com/mitchellh/vagrant/issues/713#issuecomment-4416384
Vagrant::configure('2') do |config|
  config.vm.box = "precise32"
  config.vm.box_url = "http://files.vagrantup.com/precise32.box"

  config.vm.network :private_network, ip: "192.168.33.11"

  config.vm.hostname = "repoproxy.dev"
  
  config.vm.provision :shell, :inline => "/vagrant/puppet/bootstrap"

  config.vm.provision :puppet do |puppet|
    puppet.manifests_path = "puppet"
    puppet.manifest_file  = "base.pp"
  end
  
  config.vm.provision :shell, :inline => "cd /vagrant/ && npm install"

  config.vm.synced_folder(".", "/vagrant")
  config.vm.provider "virtualbox" do |v|
    v.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate//vagrant", "1"]
  end
end
