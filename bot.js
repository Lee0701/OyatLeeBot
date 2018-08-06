
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

let learningRooms = []

const MSG_LEARNING_NOT_ENABLED = 'ERROR: 학습 불가 그룹, Learning is not enabled for group.'
const MSG_NOT_ADMIN = 'ERROR: 관리자 권한 필요, Admin privilege required.'
const MSG_ACCESS_DENIED = 'ERROR: 접근 거부, Access denied.'

const BOT_ADMIN = parseInt(process.env.BOT_ADMIN)

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
  bot.sendMessage(chatId, msg, options)
  //setTimeout(function() {
  //  bot.sendMessage(chatId, msg, options)
  //}, 115 * length)
}

bot.onText(new RegExp('/(learn)(@' + botId + ')?( (.*))?'), (msg, match) => {
  const chatId = msg.chat.id
  const memberStatus = bot.getChatMember(chatId, msg.from.id).status
  if(msg.chat.type != 'private' && memberStatus != 'administrator' && memberStatus != 'creator') {
    sendMessage(chatId, MSG_NOT_ADMIN, {reply_to_message_id: msg.message_id})
    return
  }
  if(match[4] == 'on') {
    if(learningRooms.indexOf(chatId) == -1)
      learningRooms.push(chatId)
    sendMessage(chatId, 'LEARNING: On', {reply_to_message_id: msg.message_id})
  } else if(match[4] == 'off') {
    if(learningRooms.indexOf(chatId) != -1)
      learningRooms.splice(learningRooms.indexOf(chatId), 1)
    sendMessage(chatId, 'LEARNING: Off', {reply_to_message_id: msg.message_id})
  }
})

bot.onText(new RegExp('/(ch)(@' + botId + ')?( (.*))?'), (msg, match) => {
  const chatId = msg.chat.id
  const text = match[4]
  if(text) {
    const learn = learningRooms.includes(chatId)
    if(learn)
      insertText(text, msg.from.username)
    sendMessage(chatId, chatbot.makeReply(text), {reply_to_message_id: msg.message_id})
  }
})

bot.onText(new RegExp('/(chadmin)(@' + botId + ')?( (.*))?'), (msg, match) => {
  const chatId = msg.chat.id
  const text = match[4]
  if(msg.from.id != BOT_ADMIN) {
    sendMessage(chatId, MSG_ACCESS_DENIED, {reply_to_message_id: msg.message_id})
    return
  }
  const args = text.split(' ')
  if(text) {
    if(args.length >= 2 && args[0] == 'list') {
      pgClient.query('select text from learned where teacher=\'' + args[1] + '\';', (err, res) => {
        if(err)
          console.log(err)
        let list = 'Texts learned from ' + args[1] + ':\n'
        for(let row of res.rows) {
          list += '- ' + row['text'] + '\n'
        }
        sendMessage(chatId, list, {reply_to_message_id: msg.message_id})
      })
    }
    else if(args.length >= 2 && args[0] == 'purge') {
      pgClient.query('delete from learned where teacher=\'' + args[1] + '\';', (err, res) => {
        if(err)
          console.log(err)
        sendMessage(chatId, 'Data purged.', {reply_to_message_id: msg.message_id})
      })
    }
    else if(args.length >= 2 && args[0] == 'flush') {
      pgClient.query('select text from learned where teacher=\'' + args[1] + '\';', (err, res) => {
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
        pgClient.query('delete from learned where teacher=\'' + args[1] + '\';', (err, res) => {
          if(err)
            console.log(err)
        })
        sendMessage(chatId, 'Data flushed.', {reply_to_message_id: msg.message_id})
      })
    }
  }
})

bot.onText(new RegExp('/(teach)(@' + botId + ')?( (.*))?'), (msg, match) => {
  const chatId = msg.chat.id
  const text = match[4]
  const learn = learningRooms.includes(chatId)
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
  
  const candidate = msg.text.replace(/[가-힣ㄱ-ㅎㅏ-ㅣᄀ-하-ᅵᆨ-ᇂ]/g, '')
  
  if(mfsjea.count2350(msg.text) < msg.text.length/3) {
    const result = mfsjea.jeamfs(candidate)
    if(result.score/10 > candidate.length/3.5) {
      sendMessage(chatId, '-> ' + result.str + ' (' + result.name + ')', {reply_to_message_id: msg.message_id})
    }
  }
  
})
