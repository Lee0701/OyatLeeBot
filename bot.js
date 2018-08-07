
const fs = require('fs')
const http = require('http')
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.write('')
  res.end()
}).listen(process.env.PORT || 80)

const {Client} = require('pg')

const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
})
pgClient.connect()

const TelegramBot = require('node-telegram-bot-api');

const config = require('./config.js')
const botId = config.botId
const token = config.token

const bot = new TelegramBot(token, {polling: true})

const mfsjea = require('./mfsjea.js')
const yet = require('./yethangul.js')
const chatbot = require('./chatbot.js')

const yetCommands = '옛한글|옛|yethangul|yethangeul|yet'

const MSG_LEARNING_NOT_ENABLED = 'ERROR: 학습 불가 그룹, Learning is not enabled for group.'
const MSG_NOT_ADMIN = 'ERROR: 관리자 권한 필요, Admin privilege required.'
const MSG_ACCESS_DENIED = 'ERROR: 접근 거부, Access denied.'

const BOT_ADMIN = JSON.parse(process.env.BOT_ADMIN)

pgClient.query('select * from "texts"', (err, res) => {
  if(err)
    console.log(err)
  for(let row of res.rows) {
    learnTexts(row['text'])
  }
  console.log('learning complete.')
})

const sendMessage = function(chatId, msg, options={}) {
  bot.sendChatAction(chatId, "typing")
  const length = msg.normalize("NFD").length
  // bot.sendMessage(chatId, msg, options)
  setTimeout(function() {
   bot.sendMessage(chatId, msg, options)
  }, 100)
  //setTimeout(function() {
  //  bot.sendMessage(chatId, msg, options)
  //}, 115 * length)
}

bot.onText(new RegExp('/(ch)(@' + botId + ')?( (.*))?'), (msg, match) => {
  const chatId = msg.chat.id
  const text = match[4]
  if(text) {
    sendMessage(chatId, chatbot.makeReply(text), {reply_to_message_id: msg.message_id})
  }
})

bot.onText(new RegExp('/(chadmin)(@' + botId + ')?( (.*))?'), (msg, match) => {
  const chatId = msg.chat.id
  const text = match[4]
  if(!BOT_ADMIN.includes(msg.from.id)) {
    sendMessage(chatId, MSG_ACCESS_DENIED, {reply_to_message_id: msg.message_id})
    return
  }
  const args = text.split(' ')
  if(text) {
    if(args[0] == 'list') {
      pgClient.query('select * from learned ' + parseArgs(args.slice(1)) + ';', (err, res) => {
        if(err)
          console.log(err)
        let list = 'Texts learned:\n'
        for(let row of res.rows) {
          list += '- ' + row['text'] + ' by ' + row['teacher'] + '\n'
        }
        sendMessage(chatId, list, {reply_to_message_id: msg.message_id})
      })
    }
    else if(args[0] == 'purge') {
      const where = parseArgs(args.slice(1))
      if(where == '' && args[1] != '*')
        return
      pgClient.query('delete from learned ' + where + ';', (err, res) => {
        if(err)
          console.log(err)
        sendMessage(chatId, 'Data purged.', {reply_to_message_id: msg.message_id})
      })
    }
    else if(args[0] == 'flush') {
      pgClient.query('select * from learned ' + parseArgs(args.slice(1)) + ';', (err, res) => {
        if(err)
          console.log(err)
        let list = ''
        for(let row of res.rows) {
          list += row['text'] + ';'
        }
        learnTexts(list)
        pgClient.query('insert into texts ("text") values (\'' + list + '\');', (err, res) => {
          if(err)
            console.log(err)
        })
        pgClient.query('delete from learned ' + parseArgs(args.slice(1)) + ';', (err, res) => {
          if(err)
            console.log(err)
        })
        sendMessage(chatId, 'Data flushed.', {reply_to_message_id: msg.message_id})
      })
    }
  }
})

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

bot.onText(new RegExp('/(teach)(@' + botId + ')?( (.*))?'), (msg, match) => {
  const chatId = msg.chat.id
  const text = match[4]
  if(text) {
    insertText(text, msg.from.username)
  }
})

const insertText = function(text, username) {
  pgClient.query('insert into learned ("text", "teacher") values (\'' + text + '\', \'' + username + '\');', (err, res) => {
    if(err)
      console.log(err)
  })
}

const learnTexts = function(texts) {
  for(let text of texts.split(';')) {
    if(text == '')
      continue
    chatbot.makeReply(text, true, false)
  }
}

bot.onText(new RegExp('/(' + yetCommands + ')(@' + botId + ')?( (.*))?'), (msg, match) => {
  const chatId = msg.chat.id
  const cand = match[4]
  if(msg.reply_to_message) {
    sendMessage(chatId, '-> ' + yet(msg.reply_to_message.text) + ' @' + msg.from.username, {reply_to_message_id: msg.reply_to_message.message_id})
  }
  if(cand) {
    sendMessage(chatId, '-> ' + yet(cand), {reply_to_message_id: msg.message_id})
  }
})

bot.on('inline_query', (query) => {
  const match = new RegExp('(' + yetCommands + ') (.+)').exec(query.query)
  if(match) {
    const result = yet(match[2])
    bot.answerInlineQuery(query.id, [{type: 'article', id: query.id, title: result, input_message_content: {message_text: result}}])
  } else if(query.query.length > 0) {
    const list = mfsjea.jeamfsList(query.query)
    list.sort((a, b) => b.score - a.score)
    let score = 0
    let result = []
    for(let i in list) {
      if(list[i].score < score) break
      result.push({type: 'article', id: i, title: list[i].str + ' (' + list[i].name + ')', input_message_content: {message_text: list[i].str}})
    }
    bot.answerInlineQuery(query.id, result)
  }
})

bot.on('message', (msg) => {
  const chatId = msg.chat.id
  
  if(msg.reply_to_message && msg.reply_to_message.from.username == botId) {
    sendMessage(chatId, chatbot.makeReply(msg.text), {reply_to_message_id: msg.message_id})
    return
  }
  
  const candidate = msg.text.replace(/[가-힣ㄱ-ㅎㅏ-ㅣᄀ-하-ᅵᆨ-ᇂ]/g, '')
  if(mfsjea.count2350(msg.text) < msg.text.length/3) {
    const result = mfsjea.jeamfs(candidate)
    if(result.score/10 > candidate.length/3.5) {
      sendMessage(chatId, '-> ' + result.str + ' (' + result.name + ')', {reply_to_message_id: msg.message_id})
    }
  }
  
})
