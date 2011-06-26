express = require 'express'
expose = require 'express-expose'
app = module.exports = express.createServer()

fs = require 'fs'
_ = require('underscore')._

app.configure ->
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'
  app.use express.compiler
    src: __dirname + '/source'
    dest: __dirname + '/public'
    enable: ['coffeescript']
  app.use express.static(__dirname + '/public')

app.get '/', (req, res) ->
  res.expose("var stations=#{JSON.stringify(oldStations)};")
  res.render 'index'

  
updateQueue = []
oldStations = {}

io = require('socket.io').listen(app)

fetcher = require('./fetcher').poll(30)
fetcher.on 'update', (stations) ->
  deltas = {}
  for station in stations
    delta = {}
    if oldStation = oldStations[station.id]
      delta[key] = value for key, value of station when oldStation[key] != value
    
    oldStations[station.id] = station
    deltas[station.id] = delta unless _.isEmpty(delta)
  
  io.sockets.emit('delta', deltas) unless _.isEmpty(deltas)
