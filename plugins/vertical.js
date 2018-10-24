
let API = undefined

const verticalCommands = '우종서|종서|vertical'

const FULLWIDTHS = {
  '.': '。',
  ',': '、',
  '?': '？',
  '!': '！',
}

const fullwidth = (text) => [...text].map(ch => FULLWIDTHS[ch] || ch).join('')

const vertical = function(text) {
  const grid = fullwidth(text).split('\n').reverse().map(line => [...line])
  const flipped = grid[0].map((col, i) => grid.map(row => row[i] || '  '))
  return '<pre>' + flipped.map(line => line.join('')).join('\n') + '</pre>'
}

const onVertical = function(stream) {
  if(stream.args) {
    stream.write(vertical(stream.args))
  } else {
    stream.read(msg => {
      stream.write(vertical(msg))
    })
  }
}

const onInline = function(query) {
  const match = new RegExp('^(' + verticalCommands + ') ([\\s\\S]+)$', 'm').exec(query.query)
  if(match) {
    const result = vertical(match[2])
    API.answerInlineQuery(query.id, [{type: 'article', id: query.id, title: result, input_message_content: {message_text: result, parse_mode: 'HTML'}}])
    return true
  }
  return false
}

module.exports = function(botApi) {
  API = botApi
  API.addCommand(verticalCommands, onVertical, '사용법: /vertical <텍스트>\n주어진 텍스트를 우종서로 변환합니다.')
  API.addInline(1000, onInline)
}
