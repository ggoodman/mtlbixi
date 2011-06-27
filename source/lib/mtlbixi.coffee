class window.Marker
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
  
  constructor: (@model) ->
      
    @el = new google.maps.Marker
      shadow: Marker.markerShadow
      shape: Marker.markerShape
      position: @model.get('pos')
    
    google.maps.event.addListener @el, 'click', =>
      console.log "Model", @model.getId(), @model, @model.store.getById(12)
    
  render: =>
    @updateMarker()
    @updatePosition()
    @updateName()
    
    return this
  
  bounce: =>
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
    
Ext.setup
  onReady: ->
    Ext.Anim.override({ disableAnimations: true }) if Ext.is.Android
    
    Ext.regModel 'Station',
      fields: [
        { name: 'id', type: 'int' }
        { name: 'name', type: 'string' }
        { name: 'bikes', type: 'int' }
        { name: 'free', type: 'int' }
        { name: 'lat', type: 'float' }
        { name: 'lng', type: 'float' }
        { name: 'distance', type: 'int', default: undefined }
        { name: 'pos', convert: (v, r) -> new google.maps.LatLng(r.get('lat'), r.get('lng')) }
        { name: 'marker', convert: (v, r) -> new Marker(r) }
      ]
    
    stationStore = new Ext.data.Store
      model: 'Station'
      data: stations

    trackButton = new Ext.Button
      iconCls: "locate"
      handler: ->
        map.geo.updateLocation (location) ->
          loc = new google.maps.LatLng(location.latitude, location.longitude)
          bounds = new google.maps.LatLngBounds(loc, stationStore.getAt(0).get('pos'))
          map.update(location)
          map.map.fitBounds(bounds)
      
    mapToolbar = new Ext.Toolbar
      dock: "top"
      defaults:
        iconMask: true
        ui: "plain"
      items: [
          xtype: "spacer"
        ,
          trackButton
#          xtype: "segmentedbutton"
#          allowMultiple: true
#          defaults:
#            iconMask: true
#            ui: "plain"
#          items: [trackButton]
      ]
    
    map = new Ext.Map
      dockedItems:
        xtype: "toolbar"
      useCurrentLocation: true
      mapOptions:
        zoom: 15
        mapTypeId: google.maps.MapTypeId.ROADMAP
        center: new google.maps.LatLng(45.508903, -73.554153)
        streetViewControl: false
    
    map.on 'maprender', ->
      google.maps.event.addListener map.map, 'idle', ->
        console.log "Map is idle"
        stationStore.each (station) ->
          marker = station.get('marker').render().el
          
          if map.map.getBounds().contains(marker.getPosition())
            marker.setMap(map.map) unless marker.getMap()
          else
            marker.setMap(null)

    map.geo.on 'locationupdate', (loc) ->
      this.setAutoUpdate(false)
      position = new google.maps.LatLng(loc.latitude, loc.longitude)
      stationStore.each (station) ->
        distance = google.maps.geometry.spherical.computeDistanceBetween(position, station.get('pos'))
        station.set 'distance', distance
      
      stationStore.sort('distance', 'ASC')
        
    mapPanel = new Ext.Panel
      title: "Map"
      iconCls: "maps"
      dockedItems: [mapToolbar]
      items: [map]
    
    searchPanel = new Ext.TabPanel
      title: "Search"
      iconCls: "search"
      tabBar:
        layout:
          pack: 'center'
      items: [
          title: "All"
          xtype: "list"
          store: stationStore
          itemTpl: "<h3>{name}</h3>{[distance > 1000 ? parseInt(distance / 100) / 10 + 'km' : distance + 'm']}m</div>"
        ,
          title: "Bikes"
        ,
          title: "Docks"
      ]
    
    # TODO: Make this a List
    favoritesPanel = new Ext.Panel
      title: "Favorites"
      iconCls: "favorites"
        
    panel = new Ext.TabPanel
      fullscreen: true
      animation: false
      tabBar:
        dock: 'bottom'
        ui: 'light'
        layout:
          pack: 'center'
      items: [mapPanel, searchPanel, favoritesPanel]
    
    console.log "Socket.io", io
    socket = io.connect()
    socket.on 'delta', (deltas) ->
      console.log "Received deltas", deltas
      console.log "Store", stationStore
      for id, delta of deltas
        station = stationStore.getById(parseInt(id))
        station.set(delta)
        station.get('marker').render().bounce()

###
class window.Station extends Backbone.Model
  initialize: ->
    @history = new StationHistory
    @pos = new google.maps.LatLng(@get('lat'), @get('lng'))

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
  url: '/stations.json'
  
  sortByDistancesTo: (loc) ->
    @each (station) ->
      station.set
        distance: google.maps.geometry.spherical.computeDistanceBetween(station.pos, loc)
    @comparator = (station) ->
      station.get('distance')
    @sort() #Trigger refresh

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
      center: new google.maps.LatLng(45.508903, -73.554153)
      streetViewControl: false
    
    @collection.bind 'refresh', (coll) ->
      options =
        origins: [self.loc]
        destinations: self.collection.chain()
          .filter((station) -> station.get('bikes') > 0)
          .first(5)
          .map((station) -> station.pos)
          .value()
        travelMode: google.maps.TravelMode.WALKING
      
      service = new google.maps.DistanceMatrixService()
      service.getDistanceMatrix options, (resp, status) ->
        console.log "Distances", arguments...
      
      coll.each (station) ->
        view = new Marker(model: station)
    
    @socket = io.connect()
    @socket.on 'delta', (deltas) ->
      console.log "Received deltas", arguments...
      self.collection.get(id).set(delta) for id, delta of deltas
    
    jQuery.when(@fetchLocation()).then (loc) ->
      google.maps.event.addListener(self.el, 'idle', self.render)
      
      self.loc = loc
      self.collection.sortByDistancesTo(loc) # Triggers refresh through sort()
      self.el.setCenter(loc)
      
      console.log "Bounds", self.el.getCenter(), self.el.getBounds()      
  
  render: =>
    self = this
    
    unless self.el.getBounds().contains(self.collection.at(0).pos) or self.rendered
      self.el.panTo(self.collection.at(0).pos) if confirm("There are no stations in your viccinity. Center on the closest station?")
    
    self.rendered = true
    
    self.collection.each (station) ->
      marker = station.view.render().el

      if self.el.getBounds().contains(marker.getPosition())
        marker.setMap(self.el) unless marker.getMap()
      else
        marker.setMap(null)
  
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

$ ->
  window.network = new BikeNetwork(stations)
  window.app = new Application(collection: network)
  window.search = new SearchView(collection: network)
  
  #$('#map_canvas').height($('#map_footer').css('top'))
  window.scrollTo(0, 1)
###