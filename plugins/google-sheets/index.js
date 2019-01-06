
let API = undefined

const {google} = require('googleapis')
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
let sheets = undefined
let sheetId = undefined

const MSG_ERROR = 'Google Sheets API returned an error: '

const insert = function(range, values, callback) {
  sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
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
    if(callback) callback(null)
  })
}

const select = function(range, callback) {
  sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
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
  if(typeof(values) != 'function') {
    values = () => values
  }
  const worksheet = range.split('!')[0]
  select(range, (err, rows) => {
    if(err) {
      console.error(MSG_ERROR + err)
      if(callback) callback(err)
    }
    let count = 0
    if(rows) {
      rows.forEach((row, index) => {
        const range = worksheet + '!' + 'A' + (index + 1) + ':' + 'Z' + (index + 1)
        sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: range,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: values(row, index)
          },
        }, (err, res) => {
          if(err) {
            console.error(MSG_ERROR + err)
            if(callback) callback(err)
          }
          count++
        })
      })
    }
    if(callback) callback(null, count)
  })
}

const del = function(range, callback) {
  sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: range,
  }, (err, res) => {
    if(err) {
      console.error(MSG_ERROR + err)
      if(callback) callback(err)
    }
    if(callback) callback(null)
  })
}

module.exports = function(botApi) {
  API = botApi

  sheetId = API.getConfig('sheetId')

  const jwtClient = new google.auth.JWT(API.getConfig('googleClientEmail'), null, API.getConfig('googlePrivateKey').replace(/\\n/g, '\n'), SCOPES)
  jwtClient.authorize()
  sheets = google.sheets({version: 'v4', auth: jwtClient})

  return {
    insert: insert,
    update: update,
    del: del,
    select: select,
  }
}
