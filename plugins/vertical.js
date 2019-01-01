
let API = undefined

const verticalCommands = '우종서|종서|vertical'

const HELP_VERTICAL = 'vertical_help_vertical'

const FULLWIDTHS = {
  '.': '。',
  ',': '、',
  '?': '？',
  '!': '！',
}

const fullwidth = (text) => [...text.toString()].map(ch => FULLWIDTHS[ch] || ch).join('')

const vertical = function(text) {
  const grid = fullwidth(text).split('\n').reverse().map(line => [...line])
  const flipped = grid[grid.reduce((p, c, i, a) => a[p].length > c.length ? p : i, 0)].map((col, i) => grid.map(row => (row[i] || ' ').replace(' ', '  ')))
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
  API.addCommand(verticalCommands, onVertical, HELP_VERTICAL)
  API.addInline(1000, onInline)
  return {
    locales: "vertical/locales/",
  }
}
