var log = require('../log')()
var pg = require('pg')

module.exports = Db

function Db () {
  if (!(this instanceof Db)) return new Db()
}

Db.prototype.connect = function (cb) {
  pg.connect('tcp://postgres:1234@localhost:5432/postgres', function (err, client) {
    if (err) return cb(err)
    client = new Client(client)
    cb(null, client)
  })
  return this
}

function Client (client) {
  this.client = client
}

Client.prototype.close = function () {
  this.client.end()
  return this
}

Client.prototype.clear = function (cb) {
  this.client.query(log("DROP TABLE IF EXISTS items CASCADE"), cb)
  return this
}

Client.prototype.prepare = function (cb) {
  this.client.query(log(
      "CREATE TABLE IF NOT EXISTS"
    + " items(id SERIAL, slide_id INTEGER, pod_id INTEGER, play_time TIMESTAMPTZ, duration INTEGER)"
  ), cb)
  return this
}

Client.prototype.length = function (cb) {
  var client = this.client
  client.query(log("SELECT COUNT(*) FROM items"), function (err, result) {
    if (err) return cb(err)
    var row = result.rows[0]
    if ('count' in row) {
      if (!row.count) {
        row.count = 0
        client.query(log("CREATE INDEX play_time_idx ON items(play_time)"), function (err) {
          if (err) return cb(err)
          cb(null, row.count)
        })
      }
      else cb(null, row.count)
    }
    else {
      log('unexpected response', row)
      cb(null, 0)
    }
  })
  return this
}

Client.prototype.insert = function (block, cb) {
  var client = this.client
  client.once('drain', cb)
  for(var i = 0; i < block; i++) {
    client.query({
      name: 'insert',
      text: "INSERT INTO items(slide_id, pod_id, play_time, duration) VALUES($1, $2, $3, $4)",
      values: [rand(10000), rand(500), new Date(), rand(10)]
    })
  }
  return this
}

function rand (n) {
  var ret = Math.random() * n | 0
  return ret
}
