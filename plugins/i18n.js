
const fs = require('fs')

let API = undefined
let config = require('../config.js')

const FALLBACK_LOCALE = 'en_US'
const MSG_LOCALE_ERROR = 'FATAL ERROR: FALLBACK LOCALE NOT FOUND!'
const KEY = 'i18n_locale'

let strings = {}
let users = {}

const reload = function() {
  strings = {}
  fs.readdir(config.localeDir, (err, files) => {
    if(err) return
    files.forEach(file => {
      if(file.endsWith('.json')) addLocale(file)
    })
  })
}

const addLocale = function(name) {
  fs.readFile(config.localeDir + name, 'utf8', (err, data) => {
    if(err) return
    strings[name.substring(0, name.length-5)] = JSON.parse(data)
  })
}

const getString = function(locale, key, args) {
  if(!strings[locale]) {
    if(strings[FALLBACK_LOCALE]) locale = FALLBACK_LOCALE
    else return MSG_LOCALE_ERROR
  }
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
      reload()
    },
    getString: getString,
    getUserString: getUserString,
    getUserLocale: getUserLocale,
    setUserLocale: setUserLocale,
  }
}
