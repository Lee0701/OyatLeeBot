
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
  sendMessage: function(chatId, msg, options={}) {
    bot.sendChatAction(chatId, "typing")
    const length = msg.normalize("NFD").length
    // bot.sendMessage(chatId, msg, options)
    setTimeout(function() {
     bot.sendMessage(chatId, msg, options)
    }, 100)
    //setTimeout(function() {
    //  bot.sendMessage(chatId, msg, options)
    //}, 115 * length)
  },
  answerInlineQuery: function(id, result) {
    bot.answerInlineQuery(id, result)
  }
}

const registerPlugin = function(name) {
  const plugin = require(config.pluginDir + name)
  plugins[name] = plugin
  if(plugin.setup) {
    plugin.setup(API)
  }
  if(plugin.message) {
    listeners.message.push(plugin.message)
  }
  if(plugin.inline) {
    listeners.inline.push(plugin.inline)
  }
  if(plugin.commands) {
    plugin.commands.forEach(command => {
      bot.onText(new RegExp('/(' + command.cmd + ')(@' + botId + ')?( (.*))?'), command.callback)
    })
  }
}

bot.on('inline_query', (query) => {
  for(listener of listeners.inline) {
    if(listener(query))
      return
  }
})

bot.on('message', (msg) => {
  const chatId = msg.chat.id
  
  for(listener of listeners.message) {
    if(listener(msg))
      return
  }
  
})

bot.onText(new RegExp('/(plugins)(@' + botId + ')?( (.*))?'), (msg, match) => {
  let result = 'Installed plugins:'
  for(let key in plugins) {
    result += '\n- ' + key
  }
  API.sendMessage(msg.chat.id, result, {reply_to_message_id: msg.message_id})
})
