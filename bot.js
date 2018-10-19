
const config = require('./config.js')

const fs = require('fs')
const http = require('http')
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.write('')
  res.end()
}).listen(config.port || 80)

fs.readdir(config.pluginDir, (err, files) => {
  if(err)
    return
  files.forEach(file => {
    if(file.endsWith('.js'))
      registerPlugin(file)
  })
})

let plugins = {}

let listeners = {
  message: [],
  inline: []
}

const TelegramBot = require('node-telegram-bot-api');

const botId = config.botId
const token = config.token

const bot = new TelegramBot(token, {polling: true})

const API = {
  addCommand: function(command, callback) {
    bot.onText(new RegExp('/(' + command + ')(@' + botId + ')?( (.*))?'), callback)
  },
  removeCommand: function(priority, command) {
    bot.removeTextListener(new RegExp('/(' + command + ')(@' + botId + ')?( (.*))?'))
  },
  addInline: function(priority, callback) {
    if(!listeners.inline[priority])
      listeners.inline[priority] = []
    listeners.inline[priority].push(callback)
  },
  removeInline: function(priority, callback) {
    listeners.inline[priority].splice(listeners.inline[priority].indexOf(callback), 1)
  },
  addListener: function(priority, callback) {
    if(!listeners.message[priority])
      listeners.message[priority] = []
    listeners.message[priority].push(callback)
  },
  removeListener: function(priority, callback) {
    listeners.message[priority].splice(listeners.message[priority].indexOf(callback), 1)
  },
  sendMessage: function(chatId, msg, options={}, delayed=false) {
    bot.sendChatAction(chatId, 'typing')
    if(delayed) {
      const length = msg.normalize("NFD").length
      setTimeout(function() {
        bot.sendMessage(chatId, msg, options)
      }, 115 * length)
    } else {
      bot.sendMessage(chatId, msg, options)
    }
  },
  answerInlineQuery: function(id, result) {
    bot.answerInlineQuery(id, result)
  }
}

const registerPlugin = function(name) {
  const plugin = require(config.pluginDir + name)
  plugins[name] = plugin
  plugin(API)
}

bot.on('inline_query', (query) => {
  for(let i in listeners.inline) {
    for(let listener of listeners.inline[i]) {
      if(listener(query))
        return
    }
  }
})

bot.on('message', (msg) => {
  for(let i in listeners.message) {
    for(let listener of listeners.message[i]) {
      if(listener(msg))
        return
    }
  }
})

bot.onText(new RegExp('/(plugins)(@' + botId + ')?( (.*))?'), (msg, match) => {
  let result = 'Installed plugins:'
  for(let key in plugins) {
    result += '\n- ' + key
  }
  API.sendMessage(msg.chat.id, result, {reply_to_message_id: msg.message_id})
})
