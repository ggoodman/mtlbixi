class @Marker extends Backbone.View
  @markerSize: new google.maps.Size(30, 23)
  @markerTopLeft: new google.maps.Point(0, 0)
  @markerBottomRight: new google.maps.Point(15, 23)
  
  @markerMixed: new google.maps.MarkerImage('/img/marker-mixed.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight)
  @markerEmpty: new google.maps.MarkerImage('/img/marker-empty.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight)
  @markerFull: new google.maps.MarkerImage('/img/marker-full.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight)
  @markerLocked: new google.maps.MarkerImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAXCAYAAAAcP/9qAAACOklEQVR42sWVS4saQRDHfb8f4/uBD9CDeBBZxMdBjQYDejIHBSUQPAoDouBVWFD0IvoR9lvsdW85bs57Wrwse1nIXkKQhEpXQw/DRMj2rMkW/BmY7qlfdVV1jUbDYc1m83Mmk/kSCASejUYjmM1mcLlcv5LJ5FO5XL4WRfGD5pw2GAwufD7fQa/Xg9VqBbfbDX6/H4LBIIRCIfrMZrOw2+0et9vtZrlcpl8Nrdfrn3Q63dFgMODpKCQSiUAsFoN4PE6VTqdhs9nAfr8HcmpIJBIP4/H4vWporVZ7Rx5HPCmekkGVmk6nFLpYLMBkMgEJFHK53EE12G6348dgs9nA6/XS9Co1HA4pFEVqD2w/ZocEPOKGkohFdILROxwOemKlSENJ0Hw+T6GYHbafNN89N1gQhFvmCBtKqVQqBev1mkJ7vR6ForDb2R6LxYLvPvKyj+hIq9UCNpZcTqcT5vM5hc5mMwnKMiTfS95dclGLxeIzubfQarX+0Gg0klLc7XahWq2CfG+hUJAHc8MFJnfyJ3OuRpgVVWBS2x/YJOiAqVKpSI4bjQatI3Yw7guHw9IaGSDqT0zsu7x2qNVqRR33+31QruH1YWAcLrK1S17wrdzxZDKRHGNNsY6lUolmAcWCIkNHGRRfV0ejUZF9jJ39krq2220l9F7t8LpjTjweDx0SZLCcFNZamX41d5hap9O5II9vJxz+VSSQw2t/UALRV07w1bl+yQIn+Oz2JtCXwP+5vQn0FPy/m2robxiKwut7SnMmAAAAAElFTkSuQmCC', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight)
  
  @markerShadow: new google.maps.MarkerImage('/img/marker-shadow.png', new google.maps.Size(46, 23), Marker.markerTopLeft, Marker.markerBottomRight)
  
  @markerShape:
    coord: [19, 0, 21, 1, 22, 2, 22, 3, 23, 4, 23, 5, 24, 6, 24, 7, 24, 8, 24, 9, 24, 10, 24, 11, 24, 12, 23, 13, 23, 14, 22, 15, 21, 16, 20, 17, 19, 18, 18, 19, 17, 20, 16, 21, 15, 22, 15, 22, 14, 21, 13, 20, 12, 19, 11, 18, 9, 17, 8, 16, 7, 15, 7, 14, 6, 13, 6, 12, 6, 11, 6, 10, 6, 9, 6, 8, 6, 7, 6, 6, 6, 5, 7, 4, 7, 3, 8, 2, 9, 1, 11, 0, 19, 0]
    type: 'poly'
  
  initialize: ->
    @el = new google.maps.Marker
      shadow: Marker.markerShadow
      shape: Marker.markerShape
      position: new google.maps.LatLng(@model.get('lat'), @model.get('long'))
    
    @render()
    
    @model.bind 'change', =>
      @render()
      @bounce()
    
    google.maps.event.addListener @el, 'click', =>
      console.log "Model", @model.get('id'), @model
    
  render: =>
    @updateMarker()
    @updatePosition()
    @updateName()
    @
  
  bounce: =>
    self = this
    @el.setAnimation(google.maps.Animation.BOUNCE)
    setTimeout((-> self.el.setAnimation(null)), 1000 * 30) # Bounce for 30s
    @
  
  updateMarker: ->
    if @model.get('locked') then @el.setIcon(Marker.markerLocked)
    else if @model.get('bikes') and @model.get('free') then @el.setIcon(Marker.markerMixed)
    else if @model.get('bikes') then @el.setIcon(Marker.markerFull)
    else @el.setIcon(Marker.markerEmpty)
    @
  
  updateName: ->
    @el.setTitle(@model.get('name'))
    @
  
  updatePosition: ->
    @el.setPosition(new google.maps.LatLng(@model.get('lat'), @model.get('long')))
    @

class @Station extends Backbone.Model
  initialize: ->
    @marker = new Marker(model: @)

class @Stations extends Backbone.Collection
  model: Station
  fetch: =>
    me = @
    jQuery.ajax
      url: "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D%22http%3A%2F%2Fprofil.bixi.ca%2Fdata%2FbikeStations.xml%22&format=json"
      dataType: "jsonp"
      success: (json) ->
        parseStation = (data) ->
          id: parseInt(data.id)
          name: data.name
          bikes: parseInt(data.nbBikes)
          free: parseInt(data.nbEmptyDocks)
          lat: parseFloat(data.lat)
          long: parseFloat(data.long)
          locked: data.locked == "true"
        
        unless me.length then me.refresh(_(json.query.results.stations.station).map(parseStation))
        else
          for data in json.query.results.stations.station
            station = parseStation(data)
            me.get(station.id).set(station)

class @StationMap extends Backbone.View
  #el: $('#map_canvas')
  initialize: ->
    gmapOptions =
      zoom: 15
      mapTypeId: google.maps.MapTypeId.ROADMAP
      center: new google.maps.LatLng(45.508903, -73.554153)
      streetViewControl: false
    
    @gmap = new google.maps.Map(document.getElementById('map_canvas'), gmapOptions)
    
    @collection.bind 'refresh', @render
    @collection.bind 'update', @render
    @collection.bind 'add', @render
    @collection.bind 'remove', @render
    
    google.maps.event.addListener @gmap, 'idle', =>
      @render()
  
  render: =>
    gmap = @gmap
    bounds = gmap.getBounds()
    
    @collection.each (station) ->
      marker = station.marker.render().el
      if bounds.contains(marker.getPosition())
        marker.setMap(gmap) unless marker.getMap()
      else
        marker.setMap(null)

    @

class BikeApp extends Backbone.View
  initialize: ->
    @stations = new Stations
    @map = new StationMap(collection: @stations)
    
    @stations.fetch()
    
    setInterval(@stations.fetch, 1000 * 20)

fixgeometry = ->
  scroll(0, 0)
  
  header = $("div[data-role=header]:visible")
  footer = $("div[data-role=footer]:visible")
  content = $("div[data-role=content]:visible")
  
  viewport_height = $(window).height()
  content_height = viewport_height - header.outerHeight() - footer.outerHeight()
  
  content_height -= (content.outerHeight() - content.height())
  
  content.height(content_height)

$ ->
  $(window).bind("orientationchange resize pageshow", fixgeometry)
  app = new BikeApp