const okt = require('open-korean-text-node').default
const https = require('https')

const tokenize = (text) => okt.tokenizeSync(okt.normalizeSync(text))
const tokenizeJson = (text) => okt.tokensToJsonArraySync(okt.tokenizeSync(okt.normalizeSync(text)), true)

let dictionary = {}
let reverseDictionary = {}

let keywordDictionary = {}

const SEQUENCE_LENGTH = 7
const SEARCH_LENGTH = SEQUENCE_LENGTH - 1

const PUNCTUATIONS = ['.', '?', '!']
const START = '$START$'
const END = '$END$'

const learnSentence = function(tokens) {
  tokens.unshift(START)
  tokens.push(END)
  let tmp = []
  for(let i = 0 ; i < tokens.length ; i++) {
    tmp.push(tokens[i])
    if(tmp.length >= SEQUENCE_LENGTH)
      tmp.splice(0, 1)
    if(i < tokens.length) {
      for(let j = 0 ; j < tmp.length-1 ; j++)
        putSequence(dictionary, createSequence(tmp.slice(j, tmp.length-1)), tmp[tmp.length-1])
    }
    if(i > 0) {
      for(let j = tmp.length ; j > 1; j--)
        putSequence(reverseDictionary, createSequence(tmp.slice(1, j)), tmp[0])
    }
  }
}

const learnKeywordMap = (fromKeyword, toKeyword) => putSequence(keywordDictionary, fromKeyword.join(';'), toKeyword.join(';'))

const createSequence = (seq) => seq.join('^')

const putSequence = (dict, key, value) => (dict[key]) ? (dict[key].includes(value)) ? dict[key] : dict[key].push(value) : dict[key] = [value]

const searchSequence = (dict, key) => dict[key]

const getKeywords = (tokens) => tokens.filter(token => KEYWORD_POS.includes(token.koreanPos)).map(token => token.text + ':' + token.koreanPos)

const KEYWORD_POS = ['Noun', 'VerbPrefix', 'Verb', 'Adjective', 'Adverb', 'Alpha']

const makeReply = function(text, learn=false, make=true) {
  if(learn && !make) {
    const split = text.split(/ ?\-\> ?/)
    if(split.length == 2) {
      const fromTokens = okt.tokensToJsonArraySync(tokenize(split[0]))
      let fromKeyword = getKeywords(fromTokens)
      if(fromKeyword.length == 0 || fromKeyword[0] == '')
        fromKeyword = fromTokens.map(token => token.text + ':' + token.koreanPos)
      const toTokens = okt.tokensToJsonArraySync(tokenize(split[1]))
      let toKeyword = getKeywords(toTokens)
      if(toKeyword.length == 0 || toKeyword[0] == '')
        toKeyword = toTokens.map(token => token.text + ':' + token.koreanPos)
      learnKeywordMap(fromKeyword, toKeyword)
      text = split[1]
    }
  }

  const tokens = tokenize(text)
  const tokensJson = okt.tokensToJsonArraySync(tokens, true)
  const tokenTexts = tokensJson.map(token => token.text + ':' + token.koreanPos)

  if(learn)
    learnSentence(tokenTexts)

  if(!make)
    return

  let keyWords = getKeywords(tokensJson)
  if(keyWords.length == 0 || keyWords[0] == '')
    keyWords = tokensJson.map(token => token.text + ':' + token.koreanPos)
  const converted = keywordDictionary[keyWords.join(';')]
  if(converted != undefined)
    keyWords = converted[Math.round(Math.random() * (converted.length - 1))].split(';')
  if(keyWords.length == 0 || keyWords[0] == '')
    keyWords = tokensJson.map(token => token.text + ':' + token.koreanPos)

  let start
  let idx = 0
  do {
    start = keyWords[Math.round(Math.random() * (keyWords.length - 1))]
    idx++
  } while(searchSequence(reverseDictionary, createSequence([start])) == undefined && idx < keyWords.length*2)
  keyWords.splice(keyWords.indexOf(start), 1)
  let key = [start]
  let sentence = [start]

  for(let i = 0 ; i < 20 ; i++) {
    if(key.length >= SEARCH_LENGTH)
      key.pop()
    let found = ''
    let randomFound = ''
    for(let j = key.length ; j >= 1; j--) {
      const result = searchSequence(reverseDictionary, createSequence(key.slice(0, j)))
      if(result == undefined)
        continue
      keyWords.forEach(keyWord => {
        if(result.includes(keyWord)) {
          found = keyWord
          keyWords.splice(keyWords.indexOf(keyWord), 1)
          return
        }
      })
      if(found != '')
        break
      else if(randomFound == '')
        randomFound = result[Math.round(Math.random() * (result.length - 1))]
      if(randomFound != '' && j <= 2)
        break   // 말이 중복돼서 나오는 것 방지
    }
    if(found == '')
      found = randomFound
    if(found == '')
      return '?'
    key.unshift(found)
    if(found == START)
      break
    sentence.unshift(found)
  }

  key = sentence.slice((sentence.length > SEARCH_LENGTH) ? sentence.length-SEARCH_LENGTH : 0, sentence.length).filter(k => k != '')

  if(key == undefined) return '?'

  for(let i = 0 ; i < 20 ; i++) {
    while(key.length >= SEARCH_LENGTH)
      key.splice(0, 1)
    let found = ''
    let randomFound = ''
    for(let j = 0 ; j < key.length ; j++) {
      const result = searchSequence(dictionary, createSequence(key.slice(j, key.length)))
      if(result == undefined)
        continue
      keyWords.forEach(keyWord => {
        if(result.includes(keyWord)) {
          found = keyWord
          keyWords.splice(keyWords.indexOf(keyWord), 1)
          return
        }
      })
      if(found != '')
        break
      else if(randomFound == '')
        randomFound = result[Math.round(Math.random() * (result.length - 1))]
      if(randomFound != '' && j <= 2)
        break   // 말이 중복돼서 나오는 것 방지
    }
    if(found == '')
      found = randomFound
    if(found == '')
      return '?'
    key.push(found)
    if(found == END)
      break
    sentence.push(found)
  }
  return sentence.map(token => token.substring(0, token.indexOf(':'))).join('')
}

const resetDictionary = function() {
  dictionary = {}
  reverseDictionary = {}
  keywordDictionary = {}
}

module.exports = {
  makeReply: makeReply,
  reset: resetDictionary,
  dictionary: dictionary,
  reverseDictionary: reverseDictionary,
  keywordDictionary: keywordDictionary
}
