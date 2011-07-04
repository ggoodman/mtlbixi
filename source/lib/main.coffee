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
      console.log "Model", @model.getId(), @model
    
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
    @el.setPosition(new google.maps.LatLng(@model.get('lat'), @model.get('long')))
    return this
App = {data:{}}



Ext.setup
  onReady: ->
    #App.data.ScriptTagProxy = Ext.extend Ext.data.ServerProxy,
      #doRequest: ->
      #  console.log "SciptTagProxy.doRequest", arguments...
      
    window.locationSupported = false
    currentLocation = new google.maps.LatLng(45.508903, -73.554153)
    initialLoad = true
    
    Ext.Anim.override({ disableAnimations: true })
    
    Ext.regModel 'LocalStation',
      fields: [
        { name: 'id', type: 'int' }
        { name: 'name', type: 'string' }
        { name: 'bikes', type: 'int', mapping: 'nbBikes' }
        { name: 'free', type: 'int', mapping: 'nbEmptyDocks' }
        { name: 'lat', type: 'float' }
        { name: 'long', type: 'float' }
        { name: 'distance', type: 'int', default: undefined }
        { name: 'pos', convert: (v, r) -> new google.maps.LatLng(r.get('lat'), r.get('long')) }
        { name: 'marker', convert: (v, r) -> new Marker(r) }
      ]

        
    Ext.regModel 'RemoteStation',
      fields: [
        { name: 'id', type: 'int' }
        { name: 'name', type: 'string' }
        { name: 'bikes', type: 'int', mapping: 'nbBikes' }
        { name: 'free', type: 'int', mapping: 'nbEmptyDocks' }
        { name: 'lat', type: 'float' }
        { name: 'long', type: 'float' }
      ]
    
    stationStore = new Ext.data.Store
      model: 'LocalStation'
      proxy:
        type: 'memory'
        id: 'mtlbixi.stations'
      autoLoad: true
      sorters: 'distance'
      #listeners:
        #add: (self, records, succeeded) ->
        #  for record in records
        #    record.get('marker').render()
        #update: (self, record, op) ->
        #  record.get('marker').bounce() unless initialLoad
    
    remoteStore = new Ext.data.Store
      model: 'RemoteStation'
      proxy:
        type: 'scripttag'
        url: 'http://query.yahooapis.com/v1/public/yql?q=select%20station%20from%20xml%20where%20url%3D%22http%3A%2F%2Fprofil.bixi.ca%2Fdata%2FbikeStations.xml%22&format=json'
        reader:
          type: 'json'
          root: 'query.results.stations'
          record: 'station'
      autoLoad: true
      listeners:
        add: (self, records, start) ->
          console.log "Add", arguments...
        load: (self, records, succeeded) ->
          #console.log "Load", arguments...
          loaded = []
          for record in records
            saved = stationStore.getById(parseInt(record.getId()))
            if saved
              #console.log "Saved", saved.data, "Record", record.data
              changed = []
              for field in ['name', 'bikes', 'free', 'lat', 'long']
                #console.log saved.get('name'), field, saved.get(field), record.get(field)
                if saved.get(field) != record.get(field)
                  #console.log record.get('name'), field, record.get(field), saved.get(field)
                  changed.push(field)
                  saved.set(field, saved.get(field))
              if changed.length
                saved.get('marker').render().bounce()
                #console.log saved.get('name'), changed
            else loaded.push(record.data)
          stationStore.add(loaded) if loaded.length
          refreshDistances()# if initialLoad
          stationStore.sync()
        update: ->
          console.log "Update", arguments...
        
    window.getDistance = (pos) =>
      #if locationSupported
      google.maps.geometry.spherical.computeDistanceBetween pos, currentLocation
      
    window.getTextDistance = (pos) =>
      if dist = getDistance(pos)
        return dist > 1000 ? Math.round(dist / 100) / 10 + "km" : dist + "m"
      else "unknown"
      
    stationList =
      xtype: 'list'
      store: stationStore
      itemSelector: "div.mb-station-closest"
      itemTpl:  '<div class="mb-station-list mb-station-closest">
                  <h3>
                    {name}
                    <tpl if="favorite"><span class="mb-star mb-star-selected">&#9733</span></tpl>
                  </h3>
                  <div class="mb-station-info">
                    <strong>Bikes:</strong> {bikes}
                    <strong>Free docks:</strong> {free}
                    <strong>Distance:</strong> {[values.distance > 1000 ? Math.round(values.distance / 100) / 10 + "km" : values.distance + "m"]}
                  </div>
                </div>'
      
    closestFilters =
      xtype: "segmentedbutton"
      items: [
          text: "Bikes"
          pressed: true
          handler: ->
            stationStore.clearFilter()
            stationStore.filterBy (record) ->
              record.get('bikes') > 0
            stationStore.sort() #Why do I need to do this manually?
        ,
          text: "Docks"
          handler: ->
            stationStore.clearFilter()
            stationStore.filterBy (record) ->
              record.get('free') > 0
            stationStore.sort()
      ]

    stationListPanel =
      xtype: 'panel'
      title: 'Nearest'
      iconCls: 'search'
      items: [ stationList ]
      dockedItems: [
        xtype: "toolbar"
        items: [ closestFilters ]
        layout:
          pack: "center"
      ]
    
    renderVisibleMarkers = (gmap) ->
      stationStore.each (station) ->
        marker = station.get('marker').render().el
        
        if gmap.getBounds().contains(marker.getPosition())
          marker.setMap(gmap) unless marker.getMap()
        else
          marker.setMap(null)
    
    map =
      xtype: "map"
      id: "map"
      useCurrentLocation: true
      mapOptions:
        zoom: 15
        mapTypeId: google.maps.MapTypeId.ROADMAP
        #center: new google.maps.LatLng(45.508903, -73.554153)
        streetViewControl: false
      listeners:
        beforeshow: (self) ->
          stationStore.clearFilter()
        show: (self) ->
          renderVisibleMarkers(self.map)
        maprender: (self, gmap) ->
          google.maps.event.addListener gmap, 'idle', ->
            renderVisibleMarkers(gmap)
          #renderVisibleMarkers(gmap)

    
    mapPanel =
      xtype: "panel"
      title: "Map"
      iconCls: "maps"
      #dockedItems: [mapToolbar]
      items: [ map ]
    
    closestFilters =
      xtype: "segmentedbutton"
      items: [
          text: "Bikes"
          pressed: true
          handler: ->
            stationStore.clearFilter()
            stationStore.filterBy (record) ->
              record.get('bikes') > 0
        ,
          text: "Docks"
          handler: ->
            stationStore.clearFilter()
            stationStore.filterBy (record) ->
              record.get('free') > 0
      ]
    
    panel = new Ext.TabPanel
      fullscreen: true
      tabBar:
        dock: 'bottom'
        ui: 'light'
        layout:
          pack: 'center'
      items: [ stationListPanel, mapPanel ]
      
    refreshDistances = ->
      stationStore.each (station) ->
        station.set 'distance', google.maps.geometry.spherical.computeDistanceBetween station.get('pos'), currentLocation
      stationStore.sort()
    
    geoloc = new Ext.util.GeoLocation
      autoUpdate: true
      listeners:
        locationupdate: (self) ->
          currentLocation = new google.maps.LatLng(self.latitude, self.longitude)
          locationSupported = true
          refreshDistances()
        locationerror: (self, timeout, permission) ->
          currentLocation = new google.maps.LatLng(45.508903, -73.554153) # Montreal
    
    refreshDistances = ->
      stationStore.each (station) ->
        station.set 'distance', google.maps.geometry.spherical.computeDistanceBetween station.get('pos'), currentLocation
      stationStore.sort()
      #stationList.refresh() if stationStore instanceof Ext.List and locationSupported
    
    refreshStations = ->
      #stationStore.each (station) ->
      #  station.commit(true)
      #console.log "Changed records", stationStore.getUpdatedRecords()
      initialLoad = false
      console.log "Initiating load"
      remoteStore.load()
    
    setInterval refreshStations, 1000 * 15
    
    #refreshStations() #TEST

