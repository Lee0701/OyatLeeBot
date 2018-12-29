
const config = require('./config.js')

const http = require('http')
const fs = require('fs')

const TelegramBot = require('node-telegram-bot-api');

const botId = config.botId
const token = config.token

const bot = new TelegramBot(token, {polling: true})

const INPUT_TIMEOUT = 60000
const MAX_LENGTH = 4096
const MSG_PLUGIN_LIST = 'bot_plugin_list'
const MSG_NO_HELP = 'bot_no_help'
const MSG_HELP_USAGE = 'bot_help_usage'
const MSG_CONFIG_USAGE = 'bot_config_usage'
const MSG_CONFIG_SET = 'bot_config_set'
const MSG_INVALID_CONFIG_KEY = 'bot_invalid_config_key'
const MSG_INVALID_CONFIG_VALUE = 'bot_invalid_config_value'

let plugins = {}
let listeners = {
  message: [],
  inline: [],
  command: {},
  stream: {},
  read: {}
}
let configs = {}

let users = {}

const API = {
  getPlugin: function(name) {
    return plugins[name]
  },
  getString: function(locale, key, args) {
    return API.getPlugin('i18n.js').getString(locale, key, args)
  },
  getUserString: function(userId, key, args) {
    return API.getPlugin('i18n.js').getUserString(userId, key, args)
  },
  getUserConfig: function(userId, key, defaultValue = null) {
    if(!users[userId]) return defaultValue
    if(!users[userId][key]) return defaultValue
    return users[userId][key]
  },
  setUserConfig: function(userId, key, value) {
    if(!users[userId]) users[userId] = {}
    users[userId][key] = value
    API.getPlugin('google-sheets.js').update('users!A1', [[JSON.stringify(users)]])
  },
  addConfig: function(key, values) {
    configs[key] = values
  },
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
  sendMessage: function(chatId, msg, options={}, delayed=false) {
    bot.sendChatAction(chatId, 'typing')
    msg = msg.length > MAX_LENGTH ? msg.substring(0, MAX_LENGTH-3) + '...' : msg
    if(delayed) {
      const length = msg.normalize("NFD").length
      setTimeout(function() {
        bot.sendMessage(chatId, msg, options)
      }, 109 * length)  // 2018년 10월 20일 기준 리의 평균 타속: 분당 550타
    } else {
      return bot.sendMessage(chatId, msg, options)
    }
  },
  sendPhoto: function(chatId, url, options={}) {
    bot.sendPhoto(chatId, url, options)
  },
  answerInlineQuery: function(id, result) {
    bot.answerInlineQuery(id, result)
  }
}

const registerPlugin = function(name) {
  const plugin = require(config.pluginDir + name)
  plugins[name] = plugin(API, config)
}

const matchCommand = function(msg) {
  if(!msg.text)
    return

  const commands = msg.text.split(/ ?\| ?/)
  const cmds = []

  const streams = []

  for(let i = commands.length-1 ; i >= 0 ; i--) {
    const command = commands[i]
    for(let cmd in listeners.command) {
      const regexp = new RegExp('^\\/(' + cmd + ')(?:@' + botId + ')?(?: ([\\s\\S]*))?$', 'm')
      const match = regexp.exec(command)
      if(match) {
        const prev = (streams.length > 0) ? streams[streams.length-1] : undefined

        const stream = {
          msg: msg,
          command: match[1],
          args: match[2]
        }

        stream.read = (i == 0)
            ? ((callback) => {
              API.sendMessage(msg.chat.id, 'INPUT', {reply_to_message_id: msg.message_id, parse_mode: 'HTML', reply_markup: {force_reply: true, selective: true}}).then(m => {
                const readId = m.chat.id + ',' + m.message_id
                listeners.read[readId] = (text) => callback(text)
                setTimeout(() => {
                  if(listeners.read[readId]) {
                    delete listeners.read[readId]
                    bot.deleteMessage(m.chat.id, m.message_id)
                  }
                }, INPUT_TIMEOUT)
              })
            })
            : ((callback) => {
              stream.readCallback = callback
            })
        stream.write = (i == commands.length-1)
            ? ((text, delayed=false) => API.sendMessage(msg.chat.id, text, {reply_to_message_id: msg.message_id, parse_mode: 'HTML'}, delayed))
            : ((text, delayed=false) => {
              if(prev && prev.readCallback)
                prev.readCallback(text)
            })

        cmds.push({callback: listeners.command[cmd].callback, stream: stream})
        streams.push(stream)
        break
      }
    }
  }

  for(let cmd of cmds) {
    setTimeout(() => cmd.callback(cmd.stream), 0)
  }

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
  if(msg.reply_to_message && msg.reply_to_message.from.username == botId) {
    const readId = msg.chat.id + ',' + msg.reply_to_message.message_id
    const read = listeners.read[readId]
    if(read) {
      read(msg.text)
      delete listeners.read[readId]
      bot.deleteMessage(msg.chat.id, msg.reply_to_message.message_id)
      return
    }
  }

  matchCommand(msg)

  for(let i in listeners.message) {
    for(let listener of listeners.message[i]) {
      if(listener(msg))
        return
    }
  }
})

bot.onText(new RegExp('^/(plugins)(@' + botId + ')?$'), (msg, match) => {
  let result = API.getUserString(msg.from.id, MSG_PLUGIN_LIST, [])
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
          result += API.getUserString(msg.from.id, MSG_NO_HELP, [])
        }
        break
      }
    }
  } else {
    result += API.getUserString(msg.from.id, MSG_HELP_USAGE, [botId])
    for(let cmd in listeners.command) {
      result += '\n- ' + cmd
    }
  }
  API.sendMessage(msg.chat.id, result, {reply_to_message_id: msg.message_id})
})

bot.onText(new RegExp('^/(config)(@' + botId + ')?( (.*))?$'), (msg, match) => {
  const regex = RegExp('([^\\"]\\S*|".+?")\\s*', 'g')
  let args = []
  while(true) {
    const m = regex.exec(match[4])
    if(!m) break
    else args.push(m[1].replace(/"/g, ''))
  }
  if(args && args.length >= 2) {
    const key = args[0]
    const value = args[1]
    if(configs[key]) {
      if(configs[key].length > 0 && configs[key].includes(value) || configs[key].length == 0) {
        API.setUserConfig(msg.from.id, key, value)
        API.sendMessage(msg.chat.id, API.getUserString(msg.from.id, MSG_CONFIG_SET, []), {reply_to_message_id: msg.message_id})
      } else {
        API.sendMessage(msg.chat.id, API.getUserString(msg.from.id, MSG_INVALID_CONFIG_VALUE, []), {reply_to_message_id: msg.message_id})
      }
    } else {
      API.sendMessage(msg.chat.id, API.getUserString(msg.from.id, MSG_INVALID_CONFIG_KEY, []), {reply_to_message_id: msg.message_id})
    }
  } else {
    API.sendMessage(msg.chat.id, API.getUserString(msg.from.id, MSG_CONFIG_USAGE, [botId]), {reply_to_message_id: msg.message_id})
  }
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
  for(let name in plugins) {
    if(plugins[name] && plugins[name].init) plugins[name].init()
  }
  API.getPlugin('google-sheets.js').select('users!A:A', (err, rows) => {
    users = JSON.parse(rows[0])
  })
})
