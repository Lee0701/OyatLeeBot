
const fs = require('fs')

let API = undefined
let config = require('../config.js')

const FALLBACK_LOCALE = 'en_US'
const MSG_LOCALE_ERROR = 'FATAL ERROR: FALLBACK LOCALE NOT FOUND!'
const MSG_STRING_ERROR = 'FATAL ERROR: STRING NOT FOUND'
const KEY = 'locale'

let dirs = []
let strings = {}

const load = function(localeDir) {
  if(dirs.indexOf(localeDir) > -1) dirs.push(localeDir)
  fs.readdir(localeDir, (err, files) => {
    if(err) return
    files.forEach(file => {
      if(file.endsWith('.json')) addLocale(localeDir, file)
    })
    API.addUserConfigKey('locale', Object.keys(strings))
  })
}

const addLocale = function(localeDir, name) {
  const data = fs.readFileSync(localeDir + name, 'utf8')
  const locale = name.substring(0, name.length-5)
  if(!strings[locale]) strings[locale] = {}
  const parsed = JSON.parse(data)
  for(let key in parsed) strings[locale][key] = parsed[key]
}

const reload = function() {
  strings = {}
  dirs.forEach(dir => load(dir))
}

const getString = function(locale, key, args) {
  if(!strings[locale] || !strings[locale][key]) {
    if(strings[FALLBACK_LOCALE]) locale = FALLBACK_LOCALE
    else return MSG_LOCALE_ERROR
  }
  if(!strings[locale][key]) return MSG_STRING_ERROR
  return strings[locale][key].replace(/{{([0-9]+)}}/g, (match, num) => args[parseInt(num)])
}

const getUserString = function(userId, key, args) {
  return getString(API.getUserConfig(userId, KEY), key, args)
}

const getUserLocale = function(userId) {
  return API.getUserConfig(userId, KEY)
}

const setUserLocale = function(userId, locale) {
  API.setUserConfig(userId, KEY, locale)
}

module.exports = function(botApi) {
  API = botApi
  return {
    init: () => {
      load(config.localeDir)
    },
    getString: getString,
    getUserString: getUserString,
    getUserLocale: getUserLocale,
    setUserLocale: setUserLocale,
    load: load,
  }
}
