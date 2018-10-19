
const chatbot = require('./chatbot/chatbot.js')
const {Client} = require('pg')

let API = undefined
let config = undefined
let BOT_ADMIN = []

let pgClient = undefined

const MSG_LEARNING_NOT_ENABLED = 'ERROR: 학습 불가 그룹, Learning is not enabled for group.'
const MSG_NOT_ADMIN = 'ERROR: 관리자 권한 필요, Admin privilege required.'
const MSG_ACCESS_DENIED = 'ERROR: 접근 거부, Access denied.'

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
  pgClient.query('insert into learned ("text", "teacher") values ($1, $2);', [text, username], (err, res) => {
    if(err)
      console.error(err)
  })
}

const learnTexts = function(texts) {
  for(let text of texts.split(';')) {
    if(text == '')
      continue
    chatbot.makeReply(text, true, false)
  }
}

const onChat = function(msg, match) {
  const text = match[4]
  if(text) {
    API.sendMessage(msg.chat.id, chatbot.makeReply(text), {reply_to_message_id: msg.message_id}, true)
  }
}

const onMessage = function(msg) {    
  if(!msg.text)
    return false
  
  if(msg.reply_to_message && msg.reply_to_message.from.username == config.botId) {
    API.sendMessage(msg.chat.id, chatbot.makeReply(msg.text), {reply_to_message_id: msg.message_id}, true)
    return true
  }
  return false
}

const onTeach = function(msg, match) {
  const text = match[4]
  if(text) {
    insertText(text, msg.from.username)
  }
}

const onAdmin = function(msg, match) {
  const chatId = msg.chat.id
  const text = match[4]
  if(!BOT_ADMIN.includes(msg.from.id)) {
    API.sendMessage(chatId, MSG_ACCESS_DENIED, {reply_to_message_id: msg.message_id})
    return
  }
  const args = text.split(' ')
  if(text) {
    if(args[0] == 'list') {
      pgClient.query('select * from learned ' + parseArgs(args.slice(1)) + ';', (err, res) => {
        if(err)
          console.error(err)
        let list = 'Texts learned:\n'
        for(let row of res.rows) {
          list += '- ' + row['text'] + ' by ' + row['teacher'] + '\n'
        }
        API.sendMessage(chatId, list, {reply_to_message_id: msg.message_id})
      })
    }
    else if(args[0] == 'purge') {
      const where = parseArgs(args.slice(1))
      if(where == '' && args[1] != '*')
        return
      pgClient.query('delete from learned ' + where + ';', (err, res) => {
        if(err)
          console.error(err)
        API.sendMessage(chatId, 'Data purged.', {reply_to_message_id: msg.message_id})
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
        API.sendMessage(chatId, 'Data flushed.', {reply_to_message_id: msg.message_id})
      })
    }
  }
}

const onFlushRequest = function(msg, match) {
  const text = 'New flush request from @' + msg.from.username + (match[4] ? ' : ' + match[4] : '')
  
  for(let id of BOT_ADMIN)
    API.sendMessage(id, text)
}

module.exports = function(botApi, botConfig) {
  API = botApi
  config = botConfig
  BOT_ADMIN = JSON.parse(config.botAdmin)
  API.addListener(700, onMessage)
  API.addCommand('ch|챗', onChat, '사용법: /ch <메시지>\n채팅봇에게 말을 겁니다.\nTIP: 봇의 메시지에 답장을 해도 대화할 수 있습니다.')
  API.addCommand('teach', onTeach, '사용법: /teach (<질문> -> ) <답변>\n채팅봇에게 말을 가르칩니다.')
  API.addCommand('chadmin', onAdmin)
  API.addCommand('flushrequest', onFlushRequest, '사용법: /flushrequest\n봇의 관리자에게 학습 확정 요청을 보냅니다.')
  
  pgClient = new Client({
    connectionString: config.databaseUrl,
    ssl: true,
  })
  pgClient.connect()

  pgClient.query('select * from "texts"', (err, res) => {
    if(err)
      console.error(err)
    for(let row of res.rows) {
      learnTexts(row['text'])
    }
    console.log('learning complete.')
  })

}
