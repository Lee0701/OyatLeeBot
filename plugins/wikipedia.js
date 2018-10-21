
const Wikipedia = require('nodemw')

const onWiki = function(stream) {
  let lang = 'ko'
  let title = undefined
  if(stream.args) {
    const split = stream.args.split(' ')
    if(split.length >= 2 && (split[0] == '--lang' || split[0] == '-l')) {
      lang = split[1]
      split.splice(0, 2)
    }
    if(split.length >= 1)
      title = split.join(' ')
  }
  if(title) {
    searchWiki(stream, lang, title)
  } else {
    stream.read(msg => {
      searchWiki(stream, lang, msg)
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

const searchWiki = function(stream, lang, title) {
  const url = lang + '.wikipedia.org'
  const client = new Wikipedia({
    protocol: 'https',
    server: url,
    path: '/w',
    debug: false
  })
  client.getArticle(title, true, (err, result) => {
    if(err) {
      console.error(err)
    } else {
      stream.write(result.toString().replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/\[\[([^\[\]]+)\]\]/g, (match, title) => `<a href="${url}/wiki/${encodeURIComponent(title)}">${title}</a>`))
    }
  })
}

module.exports = function(API) {
  API.addCommand('wiki', onWiki)
  API.addCommand('enwiki', onEnWiki)
}
