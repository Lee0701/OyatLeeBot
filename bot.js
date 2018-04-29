
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

const sendMessage = function(chatId, msg, options={}) {
  bot.sendChatAction(chatId, "typing")
  const length = msg.normalize("NFD").length
  setTimeout(function() {
    bot.sendMessage(chatId, msg, options)
  }, 151 * length)
}

bot.onText(new RegExp('@' + botId + ' (.*)'), (msg, match) => {
  const chatId = msg.chat.id
  const txt = match[1]
  
})

bot.on('message', (msg) => {
  const chatId = msg.chat.id
  
  if(mfsjea.count2350(msg.text) < msg.text.length/3) {
    const result = mfsjea.jeamfs(msg.text)
    if(result.score/10 > msg.text.length/3.5) {
      sendMessage(chatId, '-> ' + result.str + ' (' + result.name + ')', {reply_to_message_id: msg.message_id})
    }
  }
  
})
