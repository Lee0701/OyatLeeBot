
let API = undefined

const mfsjea = require('./mfsjea/mfsjea.js')

const CONFIG_KEY_SOURCE = 'mfsjea.source'
const CONFIG_KEY_DESTINATION = 'mfsjea.destination'

const onMessage = function(msg) {
  if(!msg.text)
    return false

  const candidate = msg.text.replace(/[가-힣ㄱ-ㅎㅏ-ㅣᄀ-하-ᅵᆨ-ᇂ]/g, '')
  if(mfsjea.count2350(msg.text) < msg.text.length/3) {
    let list = mfsjea.jeamfsList(msg.text)
    list.sort((a, b) => b.score - a.score)
    const source = API.getUserConfig(msg.from.id, CONFIG_KEY_SOURCE)
    const destination = API.getUserConfig(msg.from.id, CONFIG_KEY_DESTINATION)
    list = list.filter(item => (source == null || source == 'unset' || item.source == source) && (destination == null || destination == 'unset' || item.destination == destination))
    if(list.length == 0) return false
    const result = list[0]
    if(result && result.score/10 > candidate.length/3.5) {
      API.sendMessage(msg.chat.id, '-> ' + result.str + ' (' + result.source + ' - ' + result.destination + ')', {reply_to_message_id: msg.message_id})
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

module.exports = function(botApi) {
  API = botApi
  API.addListener(2000, onMessage)
  API.addInline(2000, onInline)
  API.addConfig(CONFIG_KEY_SOURCE, [])
  API.addConfig(CONFIG_KEY_DESTINATION, [])
  return {
    auto: mfsjea.jeamfs,
    list: mfsjea.jeamfsList,
    count2350: mfsjea.count2350,
  }
}
