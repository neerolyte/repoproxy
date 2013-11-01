require 'guard'

guard "mocha-node", :mocha_bin => "vagrant/run_mocha_in_vm", :globals => ['Class', 'Base', 'params'], :reporter => 'dot' do
  watch(%r{^spec/.+\.spec\.(js|coffee)$})
  watch(%r{^lib/(.+)\.(js|coffee)$}) { |m|
    if File.file?("spec/lib/#{m[1]}\.spec.js") then
      "spec/lib/#{m[1]}\.spec.js"
    else
      "spec/lib/#{m[1]}\.spec.coffee"
    end
  }
  watch(%r{^spec/(helper|fixture).coffee$}) { 'spec' }
end

# vim: ft=ruby ts=2 sw=2 et
