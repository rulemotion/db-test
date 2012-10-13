var pg = require('pg')

var client = new pg.Client('tcp://postgres:1234@localhost:5432/postgres')
client.connect()

client.query("CREATE TEMP TABLE items(id SERIAL, slide_id INTEGER, pod_id INTEGER, play_time TIMESTAMPTZ, duration INTEGER)")
var count = 1000000
var block = 10000
var pieces = count / block

console.log("inserting %d rows", count)

function insert () {
  console.log('%d left', pieces * block)

  for(var i = 0; i < block; i++) {
    var query = {
      name: 'insert',
      text: "INSERT INTO items(slide_id, pod_id, play_time, duration) VALUES($1, $2, $3, $4)",
      values: [Math.random() * 10000 | 0, Math.random() * 500 | 0, new Date(), Math.random() * 10 | 0]
    }
    client.query(query)
  }
}

client.on('drain', function () {
  if (--pieces) {
    insert()
  }
  else {
    console.log('done inserting')
    console.log('it took %d seconds', (Date.now() - before) / 1000)
  }
})

var before = Date.now()
insert()
