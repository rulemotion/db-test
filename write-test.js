#!/usr/bin/env node

var defaultdb = 'redis'
var total = 1000000000
var block = 10000

var argv = require('./argv')
var log = require('./log')()
var Timer = require('./timer')

var dbname = argv('dbname', 'database name', function (name) { return name }) || defaultdb
argv('total', 'target total rows', function (n) { total = n })
argv('block', 'block size in rows', function (n) { block = n })
argv('output', 'output file', function (s) { log.file = s })
if (argv('clear', 'clear table', function () {
  opendb(dbname, function (err, client) {
    client.clear(run)
  })
  return true
})) return

argv('help', 'usage:', function () { log.error(argv.help), process.exit() })

run()

function opendb (name, cb) {
  var db = require('./dbs/' + name)()
  db.connect(cb)
  return db
}

function run () {
  var count = total
  var pieces = count / block

  var totalTimer = new Timer()
  var pieceTimer = new Timer()

  opendb(dbname, function (err, client) {
    client.prepare(function (err) {
      client.length(function (err, cnt) {
        count = cnt
        pieces -= Math.ceil(cnt / block)

        log('current number of rows: %d', cnt)
        log('inserting %dM rows', pieces * block / 1000 / 1000)

        client.insert(block, function tick () {
          pieceTimer.tick()

          log.write(
              '%dM written - %sK writes in %ss, %dms per write'
            , ((total - (pieces * block)) / 1000 / 1000).toFixed(3)
            , block / 1000
            , (pieceTimer.diff / 1000).toFixed(1)
            , pieceTimer.diff / block
          )

          if (--pieces >= 0) {
            client.insert(block, tick)
          }
          else {
            log('done inserting')
            log('it took %d seconds', totalTimer.tick() / 1000)
            client.close()
          }
        })
      })
    })
  })
}
