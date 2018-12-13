module.exports = function(args) {
  let result = {}
  while(true) {
    if(args.length >= 1 && (args[0].startsWith('--') || args[0].startsWith('-'))) {
      const key = args[0]
      let value = true
      args.splice(0, 1)
      if(args.length >= 1 && !(args[0].startsWith('--') || args[0].startsWith('-'))) {
        value = args[0]
        args.splice(0, 1)
      }
      result[key] = value
    } else {
      result.rest = args.join(' ')
      break
    }
  }
  return result
}
