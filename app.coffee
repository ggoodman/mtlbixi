express = require 'express'
app = module.exports = express.createServer()

settings = require './settings'

mongoose = require 'mongoose'
mongoose.connect settings.mongodb.server

models = require './models'
models.initModels(mongoose)

Station = mongoose.model('Station')

Fetcher = require './fetcher'

fetcher = new Fetcher
  interval: 30 # minutes
fetcher.on 'station', (station) ->
  addHistory = (record) ->
    record.history.push
      time: +new Date()
      bikes: station.nbBikes
      free: station.nbEmptyDocks
    
    record.save (err) ->
      console.log "Save error:", arguments... if err
  
  Station.findOne {id: station.id}, (err, record) ->
    if record
      addHistory(record)
    else
      record = new Station
        id: station.id
        name: station.name
        loc:
          lat: station.lat
          lng: station.long
      
      record.save (err) ->
        addHistory(record) unless err

app.configure ->
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'


app.get '/', (req, res) ->
  res.send "Hello world"