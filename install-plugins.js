
const config = require('./config.js')

const npm = require('npm')

const fs = require('fs')

const installPlugin = function(name) {
  const pluginDir = config.pluginDir + name + '/'
  if(!fs.existsSync(pluginDir + 'plugin.json')) return
  const data = fs.readFileSync(pluginDir + 'plugin.json', 'utf8')
  const plugin = JSON.parse(data)
  plugin.dir = pluginDir
  if(plugin.packages) {
    npm.load((err) => {
      if(err) {
        console.log(err)
        return
      }
      npm.commands.install(plugin.packages, (err, data) => {
        if(err) {
          console.log(err)
          return
        }
      })
      npm.on('log', msg => console.log)
    })
  }
}

fs.readdir(config.pluginDir, (err, files) => {
  if(err)
    return
  files.forEach(file => {
    installPlugin(file)
  })
})
