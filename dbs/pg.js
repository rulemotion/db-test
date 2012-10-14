var EventEmitter = require('events').EventEmitter
var log = require('../log')()

var pg = require('pg')

module.exports = function () {
  var db = new Db(new pg.Client('tcp://postgres:1234@localhost:5432/postgres'))
  db.client.on('drain', function () { db.emit('drain') })
  return db
}

function Db (client) {
  this.client = client
}

require('util').inherits(Db, EventEmitter)

Db.prototype.connect = function () {
  this.client.connect()
  return this
}

Db.prototype.close = function () {
  this.client.end()
  return this
}

Db.prototype.clear = function () {
  this.client.query(log("DROP TABLE IF EXISTS items CASCADE"))
  return this
}

Db.prototype.prepare = function () {
  this.client.query(log(
      "CREATE TABLE IF NOT EXISTS"
    + " items(id SERIAL, slide_id INTEGER, pod_id INTEGER, play_time TIMESTAMPTZ, duration INTEGER)"
  ))
  return this
}

Db.prototype.length = function (fn) {
  var client = this.client
  var query = client.query(log("SELECT COUNT(*) FROM items"))
  query.once('row', function (row) {
    if ('count' in row) {
      if (!row.count) {
        row.count = 0
        client.query(log("CREATE INDEX play_time_idx ON items(play_time)"))
      }
      fn(row.count)
    }
    else {
      console.log('unexpected response', row)
      fn(0)
    }
  })
  return this
}

Db.prototype.insert = function (block) {
  var client = this.client
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
