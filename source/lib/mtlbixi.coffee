class window.Station extends Backbone.Model
  initialize: ->
    @history = new StationHistory
    @pos = new google.maps.LatLng(@get('lat'), @get('lng'))
    @set
      distance: google.maps.geometry.spherical.computeDistanceBetween(@pos, @collection.loc)

class window.StationEvent extends Backbone.Model

class window.StationHistory extends Backbone.Collection
  model: StationEvent
  
  pushBikeEvent: (bikes, prevBikes) ->
    delta = bikes - prevBikes
    abs = Math.abs(delta)
    inout = if delta > 0 then 'in' else 'out'
    plural = if abs > 1 then "s" else ""
    werewas = if plural then "were" else "was"
    
    @add
      message: "#{abs} bike#{plural} #{werewas} checked #{inout}"
      time: new Date
    
    console.log @station.get('name'), "#{abs} bike#{plural} #{werewas} checked #{inout}"

class window.BikeNetwork extends Backbone.Collection
  model: Station
  comparator: (station) ->
    station.get('distance')
    
  url: '/stations.json'

class window.Marker extends Backbone.View
  @markerSize: new google.maps.Size(30, 23)
  @markerTopLeft: new google.maps.Point(0, 0)
  @markerBottomRight: new google.maps.Point(15, 23)
  
  @markerMixed: new google.maps.MarkerImage('/img/marker-mixed.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight)
  @markerEmpty: new google.maps.MarkerImage('/img/marker-empty.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight)
  @markerFull: new google.maps.MarkerImage('/img/marker-full.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight)
  @markerLocked: new google.maps.MarkerImage('/img/marker-disabled.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight)
  
  @markerShadow: new google.maps.MarkerImage('/img/marker-shadow.png', new google.maps.Size(46, 23), Marker.markerTopLeft, Marker.markerBottomRight)
  
  @markerShape:
    coord: [19, 0, 21, 1, 22, 2, 22, 3, 23, 4, 23, 5, 24, 6, 24, 7, 24, 8, 24, 9, 24, 10, 24, 11, 24, 12, 23, 13, 23, 14, 22, 15, 21, 16, 20, 17, 19, 18, 18, 19, 17, 20, 16, 21, 15, 22, 15, 22, 14, 21, 13, 20, 12, 19, 11, 18, 9, 17, 8, 16, 7, 15, 7, 14, 6, 13, 6, 12, 6, 11, 6, 10, 6, 9, 6, 8, 6, 7, 6, 6, 6, 5, 7, 4, 7, 3, 8, 2, 9, 1, 11, 0, 19, 0]
    type: 'poly'
  
  initialize: ->
    @model.view = this
    @history = new StationHistory
    @history.station = @model
    
    @model.bind 'change:bikes', =>
      @updateMarker()
      @history.pushBikeEvent @model.get('bikes'), @model.previous('bikes')
      
    @model.bind 'change', =>
      @render()
      @bounceMarker()
      
    @el = new google.maps.Marker
      shadow: Marker.markerShadow
      shape: Marker.markerShape
    
  render: =>
    @updateMarker()
    @updatePosition()
    @updateName()
    
    return this
  
  bounceMarker: =>
    self = this
    @el.setAnimation(google.maps.Animation.BOUNCE)
    setTimeout((-> self.el.setAnimation(null)), 1000 * 30) # Bounce for 30s
    
    return this
  
  updateMarker: ->
    if @model.get('locked') then @el.setIcon(Marker.markerLocked)
    else if @model.get('bikes') and @model.get('free') then @el.setIcon(Marker.markerMixed)
    else if @model.get('bikes') then @el.setIcon(Marker.markerFull)
    else @el.setIcon(Marker.markerEmpty)
    return this
  
  updateName: ->
    @el.setTitle(@model.get('name'))
    return this
  
  updatePosition: ->
    @el.setPosition(new google.maps.LatLng(@model.get('lat'), @model.get('lng')))
    return this


class window.Application extends Backbone.View
  initialize: ->
    self = this
    
    @el = new google.maps.Map document.getElementById("map_canvas"),
      zoom: 15
      mapTypeId: google.maps.MapTypeId.ROADMAP
      center: null
      streetViewControl: false
    
    @collection.bind 'refresh', (coll) ->      
      coll.each (station) ->
        view = new Marker(model: station)
        
    
    jQuery.when(@fetchLocation(), @fetchStations()).then (loc, stations) ->
      self.collection.loc = loc
      self.collection.refresh(stations)

      google.maps.event.addListener(self.el, 'idle', self.render)
      
      self.el.setCenter(loc)     
  
  render: =>
    self = this
    
    self.collection.each (station) ->
      marker = station.view.render().el
      
      console.log station.get('name'), parseInt(station.get('distance') / 1000) + "km"
      ###
      if distance < closestDistance
        closestDistance = distance
        closestStation = marker.getPosition()
      ###
      if self.el.getBounds().contains(marker.getPosition())
        marker.setMap(self.el) unless marker.getMap()
        #numStations++
      else
        marker.setMap(null)
    
    #unless numStations
    #  self.el.setCenter(closestStation) if confirm("There are no stations near you. Center on the closest station?")
  
  fetchLocation: ->
    self = this

    jQuery.Deferred((dfr) ->
      montreal = new google.maps.LatLng(45.508903, -73.554153)
      if navigator.geolocation
        navigator.geolocation.getCurrentPosition(
          (pos) -> dfr.resolve(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude))
          () -> dfr.resolve(montreal)
        )
      else dfr.resolve(montreal)
    ).promise()
  
  fetchStations: ->
    self = this
    
    @socket = io.connect()
    @socket.on 'delta', (deltas) ->
      console.log "Received deltas", arguments...
      self.collection.get(id).set(delta) for id, delta of deltas

    jQuery.Deferred((dfr) ->
      self.socket.emit 'fetch', (stations) ->
        dfr.resolve(_.values(stations))
    ).promise()


$ ->
  network = new BikeNetwork(stations)
  app = new Application(collection: network)
  
  #$('#map_canvas').height($('#map_footer').css('top'))
    
