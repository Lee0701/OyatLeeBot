
let API = undefined

let config = require('../config.js')

const {google} = require('googleapis')
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
let sheets = undefined

const MSG_ERROR = 'Google Sheets API returned an error: '

const insert = function(range, values, callback) {
  sheets.spreadsheets.values.append({
    spreadsheetId: config.sheetId,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: values
    },
  }, (err, res) => {
    if(err) {
      console.error(MSG_ERROR + err)
      if(callback) callback(err)
    }
  })
}

const select = function(range, callback) {
  sheets.spreadsheets.values.get({
    spreadsheetId: config.sheetId,
    range: range,
  }, (err, res) => {
    if(err) {
      return console.error(MSG_ERROR + err)
      if(callback) callback(err)
    }
    if(callback) callback(null, res.data.values)
  })
}

const update = function(range, values, callback) {
  sheets.spreadsheets.values.update({
    spreadsheetId: config.sheetId,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: values
    },
  }, (err, res) => {
    if(err) {
      console.error(MSG_ERROR + err)
      if(callback) callback(err)
    }
  })
}

const del = function(range, callback) {
  sheets.spreadsheets.values.clear({
    spreadsheetId: config.sheetId,
    range: range,
  }, (err, res) => {
    if(err) {
      console.error(MSG_ERROR + err)
      if(callback) callback(err)
    }
  })
}

module.exports = function(botApi) {
  API = botApi

    const jwtClient = new google.auth.JWT(config.googleClientEmail, null, config.googlePrivateKey.replace(/\\n/g, '\n'), SCOPES)
    jwtClient.authorize()
    sheets = google.sheets({version: 'v4', auth: jwtClient})

  return {
    insert: insert,
    update: update,
    del: del,
    select: select,
  }
}
