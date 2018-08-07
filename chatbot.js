const twtkr = require('node-twitter-korean-text')
const https = require('https')

const tokenize = (text) => twtkr.tokenizeSync(twtkr.normalizeSync(text))
const tokenizeJson = (text) => twtkr.tokensToJsonArraySync(twtkr.tokenizeSync(twtkr.normalizeSync(text)), true)

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
    if(tmp.length >= SEARCH_LENGTH)
      tmp.splice(0, 1)
    if(i < tokens.length-1) {
      for(let j = 0 ; j < SEARCH_LENGTH-1 ; j++)
        putSequence(dictionary, createSequence(tmp.slice(j, SEARCH_LENGTH)), tokens[i+1])
    }
    if(i >= tmp.length) {
      for(let j = tmp.length ; j >= 1; j--)
        putSequence(reverseDictionary, createSequence(tmp.slice(0, j)), tokens[i-tmp.length])
    }
  }
}

const learnKeywordMap = (fromKeyword, toKeyword) => putSequence(keywordDictionary, fromKeyword.join(';'), toKeyword.join(';'))

const createSequence = (seq) => seq.join('^')

const putSequence = (dict, key, value) => (dict[key]) ? (dict[key].includes(value)) ? dict[key] : dict[key].push(value) : dict[key] = [value]

const searchSequence = (dict, key) => dict[key]

const getKeywords = (phrases) => [].concat.apply([], phrases.map(phrase => tokenizeJson(phrase.text).map(token => token.text + ':' + token.koreanPos))).filter((elem, index, self) => index == self.indexOf(elem)).filter(keyWord => !NG_KEYWORD.includes(keyWord.substring(keyWord.indexOf(':')+1)))

const NG_KEYWORD = ['Josa', 'Space', 'Eomi']

const makeReply = function(text, learn=false, make=true) {
  if(learn && !make) {
    const split = text.split(/ ?\-\> ?/)
    if(split.length == 2) {
      const fromKeyword = getKeywords(twtkr.extractPhrasesSync(tokenize(split[0])))
      const toKeyword = getKeywords(twtkr.extractPhrasesSync(tokenize(split[1])))
      learnKeywordMap(fromKeyword, toKeyword)
      text = split[1]
    }
  }
  
  const tokens = tokenize(text)
  const tokensJson = twtkr.tokensToJsonArraySync(tokens, true)
  const phrases = twtkr.extractPhrasesSync(tokens)
  const tokenTexts = tokensJson.map(token => token.text + ':' + token.koreanPos)
  if(learn)
    learnSentence(tokenTexts)
  
  if(!make)
    return
  
  let keyWords = getKeywords(phrases)
  const converted = keywordDictionary[keyWords.join(';')]
  if(converted != undefined)
    keyWords = converted[Math.round(Math.random() * (converted.length - 1))].split(';')
  
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
        found = result[Math.round(Math.random() * (result.length - 1))]
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
  
  key = sentence.slice(sentence.length-SEARCH_LENGTH, sentence.length).filter(k => k != '')
  
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
        found = result[Math.round(Math.random() * (result.length - 1))]
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

const saveDictionary = function() {
  
}

module.exports = {
  makeReply: makeReply,
  dictionary: dictionary,
  reverseDictionary: reverseDictionary,
  keywordDictionary: keywordDictionary
}
