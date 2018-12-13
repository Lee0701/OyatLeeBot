
const wtf = require('wtf_wikipedia')

const parse = require('../parse-args.js')

let API

const onWiki = function(stream) {
  let lang = 'ko'
  let format = 'full'
  let title = undefined
  if(stream.args) {
    const args = parse(stream.args.split(' '))
    console.log(args)
    lang = args['--lang'] || args['-l'] || 'ko'
    format = args['--format'] || args['-f'] || 'full'
    title = args.rest
  }
  if(title) {
    searchWiki(stream, lang, title, format)
  } else {
    stream.read(msg => {
      searchWiki(stream, lang, msg, format)
    })
  }
}

const onEnWiki = function(stream) {
  const title = stream.args
  const lang = 'en'
  if(title) {
    searchWiki(stream, lang, title)
  } else {
    stream.read(msg => {
      searchWiki(stream, lang, msg)
    })
  }
}

const searchWiki = function(stream, lang, title, format) {
  wtf.fetch(title, lang, (err, doc) => {
    if(err) {
      stream.write('에러, ERROR.')
      return
    }
    if(format == 'summary' || format == 's') stream.write(doc.sections(0).text())
    else stream.write(doc.text())
  })
}

module.exports = function(botApi) {
  API = botApi
  API.addCommand('wiki', onWiki)
  API.addCommand('enwiki', onEnWiki)
}
