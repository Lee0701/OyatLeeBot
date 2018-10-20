
let API = undefined
let config = undefined

const onUpper = function(msg, args) {
  if(args) {
    API.sendMessage(msg.chat.id, args.toUpperCase(), {reply_to_message_id: msg.message_id})
  } else {
    API.addInput(msg.chat.id, msg.message_id, (m) => {
      API.sendMessage(m.chat.id, m.text.toUpperCase(), {reply_to_message_id: m.message_id})
    }, 'INPUT: 대문자로 변환할 문자열 입력, Enter a string to convert to uppercase.')
  }
}

module.exports = function(botApi, botConfig) {
  API = botApi
  config = botConfig
  API.addCommand('upper|대문자', onUpper)
}
