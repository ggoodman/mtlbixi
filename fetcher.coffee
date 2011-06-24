events = require 'events'
http = require 'http'
xml2js = require 'xml2js'

class StationFetcher extends events.EventEmitter
  constructor: (interval) ->    
    @interval |= 1000 * 60
    
    @fetcher = setInterval(@fetch, @interval)
    @fetch()

  fetch: =>
    self = this
    
    parser = new xml2js.Parser
    parser.addListener 'end', (result) ->
      stations = []
      
      for station in result.station
        stations.push
          id: parseInt(station.id)
          name: station.name
          lat: parseFloat(station.lat)
          lng: parseFloat(station.long)
          installed: station.installed == "true"
          locked: station.locked == "true"
          #installDate: parseInt(station.installDate)
          #removalDate: parseInt(station.removalDate)
          temporary: station.temporary == "true"
          bikes: parseInt(station.nbBikes)
          free: parseInt(station.nbEmptyDocks)
 
      self.emit('update', stations)
      
    options =
      host: "profil.bixi.ca"
      port: 80
      path: "/data/bikeStations.xml"
    
    http.get options, (res) ->
      res.on 'data', (data) ->
        parser.parseString(data)
      res.on 'error', (err) ->
        self.emit('error', err)

module.exports.poll = (interval) ->
  fetcher = new StationFetcher(interval)