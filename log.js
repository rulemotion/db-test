var format = require('util').format

module.exports = function () {
  function log () {
    console.log.apply(console, arguments)
    return format.apply(this, arguments)
  }

  log.write = function () {
    if (!log.output) {
      log.output = {}
      log.file = log.file || 'out'
      log.output.stream = 
        require('fs')
        .createWriteStream(process.cwd() + '/' + log.file, {
          flags: 'a+'
        , encoding: 'utf8'
        })
    }
    var output = log.apply(this, arguments)
    log.output.stream.write(output + '\n')
  }

  return log
}
