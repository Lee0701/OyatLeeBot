
const config = require('./config.js')

const http = require('http')
const fs = require('fs')

const TelegramBot = require('node-telegram-bot-api');

const botId = config.botId
const token = config.token

const bot = new TelegramBot(token, {polling: true})

const MSG_NO_HELP = 'ERROR: 해당 명령어에 대한 도움말을 찾을 수 없습니다, Help not found for this command.'

let plugins = {}
let listeners = {
  message: [],
  inline: [],
  input: {},
  command: {}
}

const API = {
  addCommand: function(command, callback, help) {
    listeners.command[command] = {callback: callback, help: help}
  },
  removeCommand: function(priority, command) {
    delete listeners.command[command]
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
  addInput: function(chatId, messageId, callback, question) {
    if(question === undefined)
      question = 'INPUT'
    bot.sendMessage(chatId, question, {reply_to_message_id: messageId, reply_markup: {force_reply: true}}).then(msg => {
      listeners.input[msg.chat.id + ',' + msg.message_id] = callback
    })
  },
  removeInput: function(chatId, messageId) {
    delete listeners.input[chatId + ',' + messageId]
    bot.deleteMessage(chatId, messageId)
  },
  sendMessage: function(chatId, msg, options={}, delayed=false) {
    bot.sendChatAction(chatId, 'typing')
    if(delayed) {
      const length = msg.normalize("NFD").length
      setTimeout(function() {
        sendMessage(chatId, msg, options)
      }, 109 * length)  // 2018년 10월 20일 기준 리의 평균 타속: 분당 550타
    } else {
      sendMessage(chatId, msg, options)
    }
  },
  answerInlineQuery: function(id, result) {
    bot.answerInlineQuery(id, result)
  }
}

const registerPlugin = function(name) {
  const plugin = require(config.pluginDir + name)
  plugins[name] = plugin
  plugin(API, config)
}

const sendMessage = function(chatId, msg, options) {
  bot.sendMessage(chatId, msg, options)
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
  if(msg.reply_to_message) {
    const input = listeners.input[msg.chat.id + ',' + msg.reply_to_message.message_id]
    if(input) {
      input(msg)
      API.removeInput(msg.chat.id, msg.reply_to_message.message_id)
      return
    }
  }
  
  for(let cmd in listeners.command) {
    const match = new RegExp('^\\/(' + cmd + ')((?: ?\\| ?[^ \\|]+)+)?(?:@' + botId + ')?(?: (.*))?$').exec(msg.text)
    if(match) {
      if(match[2]) {
        const pipes = match[2].split(/ ?\| ?/)
        pipes[0] = match[1]
        console.log(pipes)
      }
      listeners.command[cmd].callback(msg, match[3])
    }
  }
  
  for(let i in listeners.message) {
    for(let listener of listeners.message[i]) {
      if(listener(msg))
        return
    }
  }
})

bot.onText(new RegExp('^/(plugins)(@' + botId + ')?$'), (msg, match) => {
  let result = 'Installed plugins:'
  for(let key in plugins) {
    result += '\n- ' + key
  }
  API.sendMessage(msg.chat.id, result, {reply_to_message_id: msg.message_id})
})

bot.onText(new RegExp('^/(help)(@' + botId + ')?( (.*))?$'), (msg, match) => {
  const command = match[4]
  let result = ''
  if(command) {
    for(let cmd in listeners.command) {
      if(new RegExp('^(' + cmd + ')$').exec(command)) {
        const help = listeners.command[cmd].help
        if(help) {
          result += help
        } else {
          result += MSG_NO_HELP
        }
        break
      }
    }
  } else {
    result += '사용법, Usage: /help@' + botId + ' <command>\n'
    result += '명령어 목록, Commands list:'
    for(let cmd in listeners.command) {
      result += '\n- ' + cmd
    }
  }
  API.sendMessage(msg.chat.id, result, {reply_to_message_id: msg.message_id})
})

bot.on('polling_error', (err) => {
  console.log(err)
})

// Main code.

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
