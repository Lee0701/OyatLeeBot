
const yet = require('./yethangul/yethangul.js')

let API = undefined

const yetCommands = '옛한글|옛|yethangul|yethangeul|yet'

const onYet = function(stream) {
  const cand = stream.args
  if(stream.msg.reply_to_message) {
    stream.write('-> ' + yet(stream.msg.reply_to_message.text) + ' @' + stream.msg.from.username)
  }
  if(cand) {
    stream.write('-> ' + yet(cand))
  } else {
    stream.read(msg => {
      stream.write('-> ' + yet(msg))
    })
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
  API.addCommand(yetCommands, onYet, '사용법: /yet <자모분리 옛한글>\n주어진 자모들로 옛한글을 조합합니다.')
  API.addInline(1000, onInline)
}
