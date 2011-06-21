events = require 'events'
http = require 'http'
xml2js = require 'xml2js'

class StationFetcher extends events.EventEmitter

  constructor: ->
    @options =
      host: "profil.bixi.ca"
      port: 80
      path: "/data/bikeStations.xml"

  fetch: =>
    self = this
    parser = new xml2js.Parser
    parser.addListener 'end', (result) ->
      self.emit('station', station) for station in result.station
        
    http.get @options, (res) ->
      res.on 'data', (data) ->
        parser.parseString(data)
      res.on 'error', (err) ->
        self.emit('error', err)

module.exports = StationFetcher