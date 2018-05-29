
const http = require('http')
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.write('')
  res.end()
}).listen(process.env.PORT || 80)

const TelegramBot = require('node-telegram-bot-api');

const config = require('./config.js')
const botId = config.botId
const token = config.token

const bot = new TelegramBot(token, {polling: true})

const mfsjea = require('./mfsjea.js')
const yet = require('./yethangul.js')

const yetCommands = '옛한글|옛|yethangul|yethangeul|yet'

const sendMessage = function(chatId, msg, options={}) {
  bot.sendChatAction(chatId, "typing")
  const length = msg.normalize("NFD").length
  bot.sendMessage(chatId, msg, options)
  //setTimeout(function() {
  //  bot.sendMessage(chatId, msg, options)
  //}, 115 * length)
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
