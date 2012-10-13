#!/usr/bin/env node

var total = 1000000000
var block = 1000

var pg = require('pg')

var format = require('util').format

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

function argv (s, desc, fn) {
  var n = 2
  while (n < process.argv.length + 1) {
    var a = process.argv[n++] || ''
    if ('-' != a[0]) continue
    while ('-' == a[0]) a = a.substr(1)
    if (a && s.substr(0, a.length) == a) {
      console.error(desc, process.argv.slice(n, n + fn.length).join(' '))
      fn.apply(this, process.argv.slice(n, n + fn.length))
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

function rand (n) {
  var ret = Math.random() * n | 0
  return ret
}

function insert () {
  for(var i = 0; i < block; i++) {
    var query = {
      name: 'insert',
      text: "INSERT INTO items(slide_id, pod_id, play_time, duration) VALUES($1, $2, $3, $4)",
      values: [rand(10000), rand(500), new Date(), rand(10)]
    }
    client.query(query)
  }
}

var client = new pg.Client('tcp://postgres:1234@localhost:5432/postgres')

client.connect()

argv('total', 'target total rows', function (n) { total = n })
argv('block', 'block size in rows', function (n) { block = n })
argv('output', 'output file', function (s) { log.file = s })
argv('drop', 'drop table', function () { client.query(log("DROP TABLE IF EXISTS items CASCADE")) })
argv('help', 'usage:', function () { console.error(argv.help), process.exit() })

var count = total
var pieces = count / block

var before = Date.now()
var pieceBefore = Date.now()

client.on('drain', function () {
  var diffs = (Date.now() - pieceBefore) / 1000

  pieceBefore = Date.now()

  log.write(
      '%dM written - %sK writes in %ss, %dms per write'
    , ((total - (pieces * block)) / 1000 / 1000).toFixed(3)
    , block / 1000
    , diffs.toFixed(1)
    , diffs * 1000 / 50000
  )

  if (--pieces) {
    insert()
  }
  else {
    console.log('done inserting')
    console.log('it took %d seconds', (Date.now() - before) / 1000)
  }
})

client.query(log(
    "CREATE TABLE IF NOT EXISTS"
  + " items(id SERIAL, slide_id INTEGER, pod_id INTEGER, play_time TIMESTAMPTZ, duration INTEGER)"
))

var query = client.query(log("SELECT COUNT(*) FROM items"))

query.once('row', function (row) {
  if ('count' in row) {
    if (!row.count) {
      client.query(log("CREATE INDEX play_time_idx ON items(play_time)"))
    }
    pieces -= row.count / block
    console.log('inserting %dM rows', pieces * block / 1000 / 1000)
    insert()
  }
  else {
    console.log('unexpected response', row)
    console.log('inserting anyway')
    insert()
  }
})
