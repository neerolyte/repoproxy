require 'guard'

guard "mocha-node", :mocha_bin => "vagrant/run_mocha_in_vm", :globals => ['Class', 'Base', 'params'] do
  watch(%r{^spec/.+\.spec\.(js|coffee)$})
  watch(%r{^lib/(.+)\.js$}) { |m| "spec/lib/#{m[1]}\.spec.js" }
  watch(%r{^lib/(.+)\.coffee$}) { |m| "spec/lib/#{m[1]}\.spec.coffee" }
  watch(%r{^spec/(helper|fixture).js$}) { 'spec' }
end

# vim: ft=ruby ts=2 sw=2 et
