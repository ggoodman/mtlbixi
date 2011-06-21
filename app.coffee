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

###
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

setInterval fetcher.fetch, 1000 * 60 * 60
fetcher.fetch()
###

app.configure ->
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'
  app.use express.static(__dirname + '/public')

app.get '/', (req, res) ->
  res.render "index"

app.get '/stations.json', (req, res) ->
  Station.find {}, (err, docs) ->
    res.send JSON.stringify(doc.toObject() for doc in docs)