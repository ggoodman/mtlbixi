express = require 'express'
app = module.exports = express.createServer()

fs = require 'fs'

app.configure ->
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'
  app.use express.compiler
    src: __dirname + '/source'
    dest: __dirname + '/public'
    enable: ['coffeescript']
  app.use express.static(__dirname + '/public')

app.get '/', (req, res) ->
  res.render 'index'
  
updateQueue = []
oldStations = {}
  
io = require('socket.io').listen(app)
io.sockets.on 'connection', (socket) ->
  socket.emit('update', oldStations)

fetcher = require('./fetcher').poll(30)
fetcher.on 'update', (stations) ->  
  for station in stations
    if oldStation = oldStations[station.id]
      delta = {}
      delta[key] = value for key, value of station when oldStation[key] != value
      
      io.sockets.emit('delta', key, delta) if delta
  
    oldStations[station.id] = station
