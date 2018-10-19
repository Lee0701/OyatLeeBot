
let API = undefined

const mfsjea = require('./mfsjea/mfsjea.js')

const onMessage = function(msg) {
  if(!msg.text)
    return
  
  const candidate = msg.text.replace(/[가-힣ㄱ-ㅎㅏ-ㅣᄀ-하-ᅵᆨ-ᇂ]/g, '')
  if(mfsjea.count2350(msg.text) < msg.text.length/3) {
    const result = mfsjea.jeamfs(candidate)
    if(result.score/10 > candidate.length/3.5) {
      API.sendMessage(msg.chat.id, '-> ' + result.str + ' (' + result.name + ')', {reply_to_message_id: msg.message_id})
      return true
    }
  }
  return false
}

const onInline = function(query) {
  if(query.query.length > 0) {
    const list = mfsjea.jeamfsList(query.query)
    list.sort((a, b) => b.score - a.score)
    let score = 0
    let result = []
    for(let i in list) {
      if(list[i].score < score) break
      result.push({type: 'article', id: i, title: list[i].str + ' (' + list[i].name + ')', input_message_content: {message_text: list[i].str}})
    }
    if(result.length == 0)
      return false
    API.answerInlineQuery(query.id, result)
    return true
  }
  return false
}

module.exports = {
  setup: function(botAPI) {
    API = botAPI
  },
  message: onMessage,
  inline: onInline
}
