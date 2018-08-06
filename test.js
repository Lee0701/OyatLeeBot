const chatbot = require('./chatbot.js')
const fs = require('fs')
const readline = require('readline')

fs.readFile('data.txt', function(err, data) {
  new String(data).split('\r\n').forEach(line => {
    if(line.charAt(0) == '#')
      console.log(line)
    else
      chatbot.makeReply(line, true, false)
  })
  console.log('learning complete.')
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ''
})

rl.on('line', line => {
  console.log(chatbot.makeReply(line))
})
