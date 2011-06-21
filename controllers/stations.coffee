http = require 'http'
xml2js = require 'xml2js'

exports.index = (req, res) ->
  options =
    host: "profil.bixi.ca"
    port: 80
    path: "/data/bikeStations.xml"

  parser = new xml2js.Parser
  parser.addListener 'end', (result) ->
    stations = []
    
    for station in result.station
      stations.push
        id: parseInt(station.id)
        name: station.name
        locked: station.locked == "true"
        loc:
          lat: parseFloat(station.lat)
          lng: parseFloat(station.long)
        bikes: parseInt(station.nbBikes)
        free: parseInt(station.nbEmptyDocks)
        
    res.send JSON.stringify(stations)
      
  http.get options, (res) ->
    res.on 'data', (data) ->
      parser.parseString(data)
    res.on 'error', (err) ->
      console.log "ERROR:", err