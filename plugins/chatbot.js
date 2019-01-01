
const chatbot = require('./chatbot/chatbot.js')
const {google} = require('googleapis')

let API = undefined
let config = require('../config.js')
let BOT_ADMIN = []

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

let sheets = undefined

const MSG_ACCESS_DENIED = 'bot_access_denied'
const HELP_CHAT = 'chatbot_help_chat'
const HELP_TEACH = 'chatbot_help_teach'

const parseArgs = function(args) {
  let result = 'where '
  for(let i = 0 ; i < args.length ; i++) {
    if(result != 'where ')
      result += ' and '
    if(args[i] == '-u' || args[i] == '--user') {
      result += '"teacher"=\'' + args[++i] + '\''
    } else if(args[i] == '-w' || args[i] == '--word' || args[i] == '--keyword') {
      result += '"text" like \'%' + args[++i] + '%\''
    }
  }
  if(result == 'where ')
    result = ''
  return result
}

const insertText = function(text, username) {
  API.getPlugin('google-sheets.js').insert('chatbot_data', [[text, username]])
}

const learnTexts = function(texts) {
  for(let text of texts.split(';')) {
    if(text == '')
      continue
    chatbot.makeReply(text, true, false)
  }
}

const reload = function() {
  chatbot.reset()
  API.getPlugin('google-sheets.js').select('chatbot_data!A:A', (err, rows) => {
    if(rows.length) {
      rows.forEach(row => {
        learnTexts(row[0])
      })
    }
  })
}

const onChat = function(stream) {
  const text = stream.args
  if(text) {
    const reply = chatbot.makeReply(text)
    stream.write(reply, true)
    logChat(text, reply)
  }
}

const onMessage = function(msg) {
  if(!msg.text)
    return false

  if(msg.reply_to_message && msg.reply_to_message.from.username == config.botId) {
    const reply = chatbot.makeReply(msg.text)
    API.sendMessage(msg.chat.id, reply, {reply_to_message_id: msg.message_id}, true)
    logChat(msg.text, reply)
    return true
  }
  return false
}

const onTeach = function(stream) {
  const text = stream.args
  if(text) {
    insertText(text, stream.msg.from.username)
    learnTexts(text)
  }
}

const onAdmin = function(stream) {
  const chatId = stream.msg.chat.id
  const text = stream.args
  if(!BOT_ADMIN.includes(stream.msg.from.id)) {
    stream.write(API.getUserString(stream.msg.from.id, MSG_ACCESS_DENIED, []))
    return
  }
  if(!text) return
  const args = text.split(' ')
  if(text) {
    if(args[0] == 'reload') {
      reload()
    }
    /*
    if(args[0] == 'list') {
      pgClient.query('select * from learned ' + parseArgs(args.slice(1)) + ';', (err, res) => {
        if(err)
          console.error(err)
        let list = 'Texts learned:\n'
        for(let row of res.rows) {
          list += '- ' + row['text'] + ' by ' + row['teacher'] + '\n'
        }
        stream.write(list)
      })
    }
    else if(args[0] == 'purge') {
      const where = parseArgs(args.slice(1))
      if(where == '' && args[1] != '*')
        return
      pgClient.query('delete from learned ' + where + ';', (err, res) => {
        if(err)
          console.error(err)
        stream.write('Data purged.')
      })
    }
    else if(args[0] == 'flush') {
      pgClient.query('select * from learned ' + parseArgs(args.slice(1)) + ';', (err, res) => {
        if(err)
          console.error(err)
        let list = ''
        for(let row of res.rows) {
          list += row['text'] + ';'
        }
        learnTexts(list)
        pgClient.query('insert into texts ("text") values ($1);', [list], (err, res) => {
          if(err)
            console.error(err)
        })
        pgClient.query('delete from learned ' + parseArgs(args.slice(1)) + ';', (err, res) => {
          if(err)
            console.error(err)
        })
        stream.write('Data flushed.')
      })
    }
    */
  }
}

const onFlushRequest = function(stream) {
  const text = 'New flush request from @' + stream.msg.from.username + (stream.args ? ' : ' + stream.args : '')

  for(let id of BOT_ADMIN)
    API.sendMessage(id, text)
}

const logChat = function(text, reply) {
  sheets.spreadsheets.values.append({
    spreadsheetId: config.sheetId,
    range: 'chatbot_log',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[text, reply]]
    },
  }, (err, res) => {
    if(err)
      console.error('Google Sheets API returned an error: ' + err)
  })
}

module.exports = function(botApi) {
  API = botApi
  BOT_ADMIN = JSON.parse(config.botAdmin)
  API.addListener(700, onMessage)
  API.addCommand('ch|챗', onChat, HELP_CHAT)
  API.addCommand('teach', onTeach, HELP_TEACH)
  API.addCommand('chadmin', onAdmin)

  return {
    init: () => {
        const jwtClient = new google.auth.JWT(config.googleClientEmail, null, config.googlePrivateKey.replace(/\\n/g, '\n'), SCOPES)
        jwtClient.authorize()
        sheets = google.sheets({version: 'v4', auth: jwtClient})
        reload()
    },
    locales: 'chatbot/locales/',
  }
}
