module.exports = argv

function argv (s, desc, fn) {
  var n = 2
  while (n < process.argv.length + 1) {
    var a = process.argv[n++] || ''
    if ('-' != a[0]) continue
    while ('-' == a[0]) a = a.substr(1)
    if (a && s.substr(0, a.length) == a) {
      console.error(desc, process.argv.slice(n, n + fn.length).join(' '))
      argv[s] = fn.apply(this, process.argv.slice(n, n + fn.length))
      break
    }
  }
  var args = fn.length
    ? fn
      .toString()
      .split('\n')[0]
      .split('(')[1]
      .split(')')[0]
      .replace(/[, ]{1,}/g, ' ')
    : ''
  argv.help = argv.help || ''
  argv.help += '\n  --' + s + ' ' + args + '\t\t' + desc
}
