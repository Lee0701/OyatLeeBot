
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

const sendMessage = function(chatId, msg, options={}) {
  bot.sendChatAction(chatId, "typing")
  const length = msg.normalize("NFD").length
  setTimeout(function() {
    bot.sendMessage(chatId, msg, options)
  }, 115 * length)
}

bot.onText(new RegExp('/(옛한글|옛|yethangul|yethangeul|yet)(@' + botId + ')?( (.*))?'), (msg, match) => {
  const chatId = msg.chat.id
  const cand = match[4]
  if(msg.reply_to_message) {
    sendMessage(chatId, '-> ' + yet(msg.reply_to_message.text) + ' @' + msg.from.username, {reply_to_message_id: msg.reply_to_message.message_id})
  }
  if(cand) {
    sendMessage(chatId, '-> ' + yet(cand), {reply_to_message_id: msg.message_id})
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
