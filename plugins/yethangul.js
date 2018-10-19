
const yet = require('./yethangul/yethangul.js')

let API = undefined

const yetCommands = '옛한글|옛|yethangul|yethangeul|yet'

const onYet = function(msg, match) {
  const cand = match[4]
  if(msg.reply_to_message) {
    API.sendMessage(msg.chat.id, '-> ' + yet(msg.reply_to_message.text) + ' @' + msg.from.username, {reply_to_message_id: msg.reply_to_message.message_id})
  }
  if(cand) {
    API.sendMessage(msg.chat.id, '-> ' + yet(cand), {reply_to_message_id: msg.message_id})
  }
}

const onInline = function(query) {
  const match = new RegExp('(' + yetCommands + ') (.+)').exec(query.query)
  if(match) {
    const result = yet(match[2])
    API.answerInlineQuery(query.id, [{type: 'article', id: query.id, title: result, input_message_content: {message_text: result}}])
    return true
  }
  return false
}

module.exports = function(botApi) {
  API = botApi
  API.addCommand(yetCommands, onYet)
  API.addInline(1000, onInline)
}
