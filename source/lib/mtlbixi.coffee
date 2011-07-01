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
    Ext.Anim.override({ disableAnimations: true })
    
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
      sorters: 'distance'
      getGroupString: (record) ->
        record.get('name')[0]

    trackButton =
      xtype: "button"
      iconCls: "locate"
      handler: ->
        ### TODO: Base this on google.maps event; make it TRACK location, not simply center/scale
        map = Ext.getCmp('map')
        map.geo.updateLocation (location) ->
          loc = new google.maps.LatLng(location.latitude, location.longitude)
          bounds = new google.maps.LatLngBounds(loc, stationStore.getAt(0).get('pos'))
          map.update(location)
          map.map.fitBounds(bounds)
        ###
      
    mapToolbar =
      xtype: "toolbar"
      dock: "top"
      defaults:
        iconMask: true
        ui: "plain"
      items: [
          xtype: "spacer"
        ,
          trackButton
      ]
    
    map =
      id: "map"
      xtype: "map"
      useCurrentLocation: true
      mapOptions:
        zoom: 15
        mapTypeId: google.maps.MapTypeId.ROADMAP
        center: new google.maps.LatLng(45.508903, -73.554153)
        streetViewControl: false
      listeners:
        added: (map) ->
          console.log "Added", arguments...
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
            #this.setAutoUpdate(false)
            position = new google.maps.LatLng(loc.latitude, loc.longitude)
            stationStore.each (station) ->
              distance = google.maps.geometry.spherical.computeDistanceBetween(position, station.get('pos'))
              station.set 'distance', distance
    
    mapPanel =
      xtype: "panel"
      title: "Map"
      iconCls: "maps"
      dockedItems: [mapToolbar]
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

    closestPanel =
      xtype: "panel"
      title: "Closest"
      iconCls: "search"
      dockedItems: [
        xtype: "toolbar"
        items: [ closestFilters ]
        layout:
          pack: "center"
      ]
      items: [
        xtype: "list"
        store: stationStore
        itemSelector: "div.mb-station-closest"
        itemTpl: '<div class="mb-station-list mb-station-closest">
                    <h3>
                      {name}
                      <span class="mb-star mb-star-selected">&#9733</span>
                    </h3>
                    <strong>Bikes:</strong> {bikes}
                    <strong>Free docks:</strong> {free}
                    <strong>Distance:</strong> {[values.distance > 1000 ? Math.round(values.distance / 100) / 10 + "km" : values.distance + "m"]}
                  </div>'
        listeners:
          beforerender: (list) ->
            list.store.clearFilter()
            list.store.filterBy (record) -> record.get('bikes') > 0      
      ]

    ### Deprecated
    closestPanel =
      xtype: "tabpanel"
      title: "Closest"
      iconCls: "locate"
      tabBar:
        layout:
          pack: 'center'
      defaults:
        store: stationStore
        xtype: 'list'
        itemTpl: '<div class="{id}">
                    <h3>
                      {name}
                      <span class="mb-star mb-star-selected">&#9733</span>
                    </h3>
                    <strong>Bikes:</strong> {bikes}
                    <strong>Free docks:</strong> {free}
                    <strong>Distance:</strong> {[values.distance > 1000 ? Math.round(values.distance / 100) / 10 + "km" : values.distance + "m"]}
                  </div>'
      listeners:
        beforecardswitch: (cmp, newCard, oldCard, index, animated) ->
          console.log "cardswitch", arguments...
          
          stationStore.clearFilter(true)
          
          switch newCard.title
            when "Bikes"
              stationStore.filterBy (record) -> record.get('bikes') > 0
              stationStore.sort('distance')
            when "Docks"
              stationStore.filterBy (record) -> record.get('free') > 0
              stationStore.sort('distance')
            when "All"
              stationStore.sort('name')

                  
      items: [
          title: "Bikes"
          itemSelector: '.mtlbixi-stations-bikes'
          itemCls: 'mtlbixi-stations-bikes'
          collectData: (records, start) ->
            (record.data for record in records when record.get('bikes') > 0)
        ,
          title: "Docks"
          itemSelector: '.mtlbixi-stations-docks'
          itemCls: 'mtlbixi-stations-docks'
          collectData: (records, start) ->
            (record.data for record in records when record.get('free') > 0)
        ,  
          title: "Alphabetical"
          itemSelector: '.mtlbixi-stations-all'
          itemCls: 'mtlbixi-stations-all'
          grouped: true
          indexBar: true
          listeners:
            itemtap: ->
              console.log "Item tap", arguments...
      ]
    ###
        
    # TODO: Make this a List
    favoritesPanel =
      xtype: "panel"
      title: "Favorites"
      iconCls: "favorites"
        
    panel = new Ext.TabPanel
      fullscreen: true
      defaults:
        animation: false
      tabBar:
        dock: 'bottom'
        ui: 'light'
        layout:
          pack: 'center'
      items: [closestPanel, mapPanel, favoritesPanel]
    
    console.log "Socket.io", io
    socket = io.connect()
    socket.on 'delta', (deltas) ->
      console.log "Received deltas", deltas
      console.log "Store", stationStore
      for id, delta of deltas
        station = stationStore.getById(parseInt(id))
        station.set(delta)
        station.get('marker').render().bounce()