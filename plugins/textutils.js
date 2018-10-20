
const https = require('https')

let API = undefined
let config = undefined

const onEcho = function(stream) {
  if(stream.args) {
    stream.write(stream.args)
  }
}

const onCat = function(stream) {
  if(stream.args) {
    try {
      https.get(stream.args, res => {
        res.on('data', data => {
          stream.write(data)
        })
      }).on('error', error => {
        stream.write('ERROR: ' + error.message)
      })
    } catch(e) {
      stream.write(e)
    }

  }
}

const onUpper = function(stream) {
  if(stream.args) {
    stream.write(stream.args.toUpperCase())
  } else {
    stream.read(msg => {
      stream.write(msg.toUpperCase())
    })
  }
}

const onLower = function(stream) {
  if(stream.args) {
    stream.write(stream.args.toLowerCase())
  } else {
    stream.read(msg => {
      stream.write(msg.toLowerCase())
    })
  }
}

const onAsdf = function(stream) {
  if(stream.args) {
    const result = (stream.args == 'asdf') ? 'true' : 'false'
    stream.write(result)
  } else {
    stream.read(msg => {
      const result = (msg == 'asdf') ? 'true' : 'false'
      stream.write(result)
    })
  }
}

module.exports = function(botApi, botConfig) {
  API = botApi
  config = botConfig
  API.addCommand('echo', onEcho)
  API.addCommand('cat', onCat)
  API.addCommand('upper|대문자', onUpper)
  API.addCommand('lower|소문자', onLower)
  API.addCommand('asdf', onAsdf)
}
