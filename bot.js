
const config = require('./config.js')

const npm = require('npm')

const http = require('http')
const fs = require('fs')

const TelegramBot = require('node-telegram-bot-api');

const botId = config.botId
const token = config.token

const bot = new TelegramBot(token, {polling: true})

const INPUT_TIMEOUT = 60000
const MAX_LENGTH = 4096

const MSG_ACCESS_DENIED = 'bot_access_denied'
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
let userConfigs = {}
let groupConfigs = {}

let users = {}
let groups = {}

const API = {
  getConfig: function(key) {
    return config[key]
  },
  getPlugin: function(name) {
    return plugins[name].api
  },
  getString: function(locale, key, args) {
    return API.getPlugin('i18n').getString(locale, key, args)
  },
  getUserString: function(userId, key, args) {
    return API.getPlugin('i18n').getUserString(userId, key, args)
  },
  getUserConfig: function(userId, key, defaultValue = null) {
    if(!users[userId]) return defaultValue
    if(!users[userId][key]) return defaultValue
    return users[userId][key]
  },
  setUserConfig: function(userId, key, value) {
    if(!users[userId]) users[userId] = {}
    users[userId][key] = value
    API.getPlugin('google-sheets').update('users!A1', [[JSON.stringify(users)]])
  },
  getGroupConfig: function(chatId, key, defaultValue = null) {
    if(!groups[chatId] || !groups[chatId][key]) return defaultValue
    return groups[chatId][key]
  },
  setGroupConfig: function(chatId, key, value) {
      if(!groups[chatId]) groups[chatId] = {}
      groups[chatId][key] = value
      API.getPlugin('google-sheets').update('users!A2', [[JSON.stringify(groups)]])
  },
  addUserConfigKey: function(key, values) {
    userConfigs[key] = values
  },
  addGroupConfigKey: function(key, values) {
    groupConfigs[key] = values
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
  const pluginDir = config.pluginDir + name + '/'
  if(!fs.existsSync(pluginDir + 'plugin.json')) return
  const data = fs.readFileSync(pluginDir + 'plugin.json', 'utf8')
  const plugin = JSON.parse(data)
  plugin.dir = pluginDir
  plugin.loaded = false
  plugins[plugin.name] = plugin
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
        if(plugin.main) plugin.api = require(pluginDir + plugin.main)(API)
        plugin.loaded = true
      })
      npm.on('log', msg => console.log)
    })
  } else {
    if(plugin.main) plugin.api = require(pluginDir + plugin.main)(API)
    plugin.loaded = true
  }
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
        const previous = (streams.length > 0) ? streams[streams.length-1] : undefined

        const stream = new Stream(msg, match[1], match[2], previous, i == commands.length-1, i == 0)

        cmds.push({callback: listeners.command[cmd].callback, stream: stream})
        streams.push(stream)
        break
      }
    }
  }

  for(let cmd of cmds) {
    setTimeout(() => cmd.callback(cmd.stream), 0)
  }
  if(cmds.length > 0) return true
  else return false
}

const Stream = function(msg, command, args, previous=undefined, first=false, last=false) {
  this.msg = msg
  this.command = command
  this.args = args
  this.buffer = []
  this.writeBuffer = (msg) => this.buffer.push(msg)
  if(last) {
    this.read = (callback) => {
      API.sendMessage(msg.chat.id, 'INPUT>', {reply_to_message_id: msg.message_id, parse_mode: 'HTML', reply_markup: {force_reply: true, selective: true}}).then(m => {
        const readId = m.chat.id + ',' + m.message_id
        listeners.read[readId] = (text) => callback(text)
        setTimeout(() => {
          if(listeners.read[readId]) {
            delete listeners.read[readId]
            bot.deleteMessage(m.chat.id, m.message_id)
          }
        }, INPUT_TIMEOUT)
      })
    }
  } else {
    this.read = (callback) => {
      const readBuffer = () => this.buffer.length > 0 ? callback(this.buffer.splice(0, 1)[0]) : setTimeout(readBuffer, 100)
      readBuffer()
    }
  }
  if(first) {
    this.write = (text, delayed=false) => {
      API.sendMessage(msg.chat.id, text, {reply_to_message_id: msg.message_id, parse_mode: 'HTML'}, delayed)
    }
  } else {
    if(previous && previous.writeBuffer) {
      this.write = (text, delayed=false) => {
        previous.writeBuffer(text)
      }
    }
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

  if(matchCommand(msg)) return

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
    result += '\n- ' + plugins[key].name
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
        const helpString = API.getUserString(msg.from.id, help, [])
        if(helpString) {
          result += helpString
        } else if(help) {
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
    if(userConfigs[key]) {
      if(userConfigs[key].length > 0 && userConfigs[key].includes(value) || userConfigs[key].length == 0) {
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

bot.onText(new RegExp('^/(groupconfig)(@' + botId + ')?( (.*))?$'), (msg, match) => {
  bot.getChatMember(msg.chat.id, msg.from.id).then((member) => {
    if(!checkAdmin(member)) {
      API.sendMessage(msg.chat.id, API.getUserString(msg.from.id, MSG_ACCESS_DENIED, []), {reply_to_message_id: msg.message_id})
      return
    }
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
      if(groupConfigs[key]) {
        if(groupConfigs[key].length > 0 && groupConfigs[key].includes(value) || groupConfigs[key].length == 0) {
          API.setGroupConfig(msg.chat.id, key, value)
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
})

const checkAdmin = function(member) {
  if(member.status === 'creator' || member.status === 'administrator') return true
  else return false
}

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
    registerPlugin(file)
  })
  const checkLoaded = () => {
    if(!Object.values(plugins).every(plugin => plugin.loaded)) setTimeout(checkLoaded, 100)
    else initPlugins()
  }
  checkLoaded()
})

const initPlugins = function() {
  for(let key in plugins) {
    const plugin = plugins[key]
    if(plugin.localeDir) API.getPlugin('i18n').load(plugin.dir + plugin.localeDir)
    if(plugin.api && plugin.api.init) plugin.api.init()
  }
  loadUsers()
  loadGroups()
}

const loadUsers = function() {
  API.getPlugin('google-sheets').select('users!A1:A1', (err, rows) => {
    users = JSON.parse(rows[0])
  })
}

const loadGroups = function() {
  API.getPlugin('google-sheets').select('users!A2:A2', (err, rows) => {
    groups = JSON.parse(rows[0])
  })
}
