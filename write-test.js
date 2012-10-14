#!/usr/bin/env node

var defaultdb = 'pg'
var total = 1000000000
var block = 1000

var argv = require('./argv')
var log = require('./log')()
var Timer = require('./timer')

function opendb (name) {
  var db = require('./dbs/' + name)()
  db.connect()
  return db
}

argv('dbname', 'database name', function (name) { return name })
var db = opendb(argv.dbname || defaultdb)

argv('total', 'target total rows', function (n) { total = n })
argv('block', 'block size in rows', function (n) { block = n })
argv('output', 'output file', function (s) { log.file = s })
argv('clear', 'clear table', function () { db.clear() })
argv('help', 'usage:', function () { log.error(argv.help), process.exit() })

var count = total
var pieces = count / block

var totalTimer = new Timer()
var pieceTimer = new Timer()

db.prepare()

db.length(function (cnt) {
  count = cnt
  pieces -= Math.ceil(cnt / block)

  log('current number of rows: %d', cnt)
  log('inserting %dM rows', pieces * block / 1000 / 1000)

  db.insert(block, function tick () {
    pieceTimer.tick()

    log.write(
        '%dM written - %sK writes in %ss, %dms per write'
      , ((total - (pieces * block)) / 1000 / 1000).toFixed(3)
      , block / 1000
      , (pieceTimer.diff / 1000).toFixed(1)
      , pieceTimer.diff / block
    )

    if (--pieces >= 0) {
      db.insert(block, tick)
    }
    else {
      log('done inserting')
      log('it took %d seconds', totalTimer.tick() / 1000)
      db.close()
    }
  })
})
