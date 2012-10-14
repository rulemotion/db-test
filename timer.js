module.exports = Timer

function Timer () {
  this.now = Date.now()
  this.before = this.now
}

Timer.prototype.tick = function () {
  this.now = Date.now()
  this.diff = this.now - this.before
  this.before = this.now
  return this.diff
}
