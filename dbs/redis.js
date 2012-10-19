var log = require('../log')()
var redis = require('redis')

module.exports = Db

function Db () {
  if (!(this instanceof Db)) return new Db()
}

Db.prototype.connect = function (cb) {
  cb(null, new Client(redis.createClient()))
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
  this.client.flushdb(cb)
  return this
}

Client.prototype.prepare = function (cb) {
  cb()
  return this
}

Client.prototype.length = function (cb) {
  var client = this.client
  client.zcard("items", cb)
  return this
}

Client.prototype.insert = function (block, cb) {
  var client = this.client
  var count = block
  var erred = false
  var pairs = []
  for(var i = 0; i < block; i++) {
    client.zadd("items", Date.now(), rand(10000) + ' ' + rand(500) + ' ' + rand(10), function (err) {
      if (erred) return

      if (err) {
        erred = true
        return cb(err)
      }

      if (!--count) {
        cb(null, block)
      }
    })
  }

  return this
}

function rand (n) {
  var ret = Math.random() * n | 0
  return ret
}
