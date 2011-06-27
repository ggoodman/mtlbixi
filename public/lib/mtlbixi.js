(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  window.Marker = (function() {
    Marker.markerSize = new google.maps.Size(30, 23);
    Marker.markerTopLeft = new google.maps.Point(0, 0);
    Marker.markerBottomRight = new google.maps.Point(15, 23);
    Marker.markerMixed = new google.maps.MarkerImage('/img/marker-mixed.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerEmpty = new google.maps.MarkerImage('/img/marker-empty.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerFull = new google.maps.MarkerImage('/img/marker-full.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerLocked = new google.maps.MarkerImage('/img/marker-disabled.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerShadow = new google.maps.MarkerImage('/img/marker-shadow.png', new google.maps.Size(46, 23), Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerShape = {
      coord: [19, 0, 21, 1, 22, 2, 22, 3, 23, 4, 23, 5, 24, 6, 24, 7, 24, 8, 24, 9, 24, 10, 24, 11, 24, 12, 23, 13, 23, 14, 22, 15, 21, 16, 20, 17, 19, 18, 18, 19, 17, 20, 16, 21, 15, 22, 15, 22, 14, 21, 13, 20, 12, 19, 11, 18, 9, 17, 8, 16, 7, 15, 7, 14, 6, 13, 6, 12, 6, 11, 6, 10, 6, 9, 6, 8, 6, 7, 6, 6, 6, 5, 7, 4, 7, 3, 8, 2, 9, 1, 11, 0, 19, 0],
      type: 'poly'
    };
    function Marker(model) {
      this.model = model;
      this.bounce = __bind(this.bounce, this);
      this.render = __bind(this.render, this);
      this.el = new google.maps.Marker({
        shadow: Marker.markerShadow,
        shape: Marker.markerShape,
        position: this.model.get('pos')
      });
      google.maps.event.addListener(this.el, 'click', __bind(function() {
        return console.log("Model", this.model.getId(), this.model, this.model.store.getById(12));
      }, this));
    }
    Marker.prototype.render = function() {
      this.updateMarker();
      this.updatePosition();
      this.updateName();
      return this;
    };
    Marker.prototype.bounce = function() {
      var self;
      self = this;
      this.el.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout((function() {
        return self.el.setAnimation(null);
      }), 1000 * 30);
      return this;
    };
    Marker.prototype.updateMarker = function() {
      if (this.model.get('locked')) {
        this.el.setIcon(Marker.markerLocked);
      } else if (this.model.get('bikes') && this.model.get('free')) {
        this.el.setIcon(Marker.markerMixed);
      } else if (this.model.get('bikes')) {
        this.el.setIcon(Marker.markerFull);
      } else {
        this.el.setIcon(Marker.markerEmpty);
      }
      return this;
    };
    Marker.prototype.updateName = function() {
      this.el.setTitle(this.model.get('name'));
      return this;
    };
    Marker.prototype.updatePosition = function() {
      this.el.setPosition(new google.maps.LatLng(this.model.get('lat'), this.model.get('lng')));
      return this;
    };
    return Marker;
  })();
  Ext.setup({
    onReady: function() {
      var favoritesPanel, map, mapPanel, mapToolbar, panel, searchPanel, socket, stationStore, trackButton;
      if (Ext.is.Android) {
        Ext.Anim.override({
          disableAnimations: true
        });
      }
      Ext.regModel('Station', {
        fields: [
          {
            name: 'id',
            type: 'int'
          }, {
            name: 'name',
            type: 'string'
          }, {
            name: 'bikes',
            type: 'int'
          }, {
            name: 'free',
            type: 'int'
          }, {
            name: 'lat',
            type: 'float'
          }, {
            name: 'lng',
            type: 'float'
          }, {
            name: 'distance',
            type: 'int',
            "default": void 0
          }, {
            name: 'pos',
            convert: function(v, r) {
              return new google.maps.LatLng(r.get('lat'), r.get('lng'));
            }
          }, {
            name: 'marker',
            convert: function(v, r) {
              return new Marker(r);
            }
          }
        ]
      });
      stationStore = new Ext.data.Store({
        model: 'Station',
        data: stations
      });
      trackButton = new Ext.Button({
        iconCls: "locate",
        handler: function() {
          return map.geo.updateLocation(function(location) {
            var bounds, loc;
            loc = new google.maps.LatLng(location.latitude, location.longitude);
            bounds = new google.maps.LatLngBounds(loc, stationStore.getAt(0).get('pos'));
            map.update(location);
            return map.map.fitBounds(bounds);
          });
        }
      });
      mapToolbar = new Ext.Toolbar({
        dock: "top",
        defaults: {
          iconMask: true,
          ui: "plain"
        },
        items: [
          {
            xtype: "spacer"
          }, trackButton
        ]
      });
      map = new Ext.Map({
        dockedItems: {
          xtype: "toolbar"
        },
        useCurrentLocation: true,
        mapOptions: {
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          center: new google.maps.LatLng(45.508903, -73.554153),
          streetViewControl: false
        }
      });
      map.on('maprender', function() {
        return google.maps.event.addListener(map.map, 'idle', function() {
          console.log("Map is idle");
          return stationStore.each(function(station) {
            var marker;
            marker = station.get('marker').render().el;
            if (map.map.getBounds().contains(marker.getPosition())) {
              if (!marker.getMap()) {
                return marker.setMap(map.map);
              }
            } else {
              return marker.setMap(null);
            }
          });
        });
      });
      map.geo.on('locationupdate', function(loc) {
        var position;
        this.setAutoUpdate(false);
        position = new google.maps.LatLng(loc.latitude, loc.longitude);
        stationStore.each(function(station) {
          var distance;
          distance = google.maps.geometry.spherical.computeDistanceBetween(position, station.get('pos'));
          return station.set('distance', distance);
        });
        return stationStore.sort('distance', 'ASC');
      });
      mapPanel = new Ext.Panel({
        title: "Map",
        iconCls: "maps",
        dockedItems: [mapToolbar],
        items: [map]
      });
      searchPanel = new Ext.TabPanel({
        title: "Search",
        iconCls: "search",
        tabBar: {
          layout: {
            pack: 'center'
          }
        },
        items: [
          {
            title: "All",
            xtype: "list",
            store: stationStore,
            itemTpl: "<h3>{name}</h3>{[console.log(this)]} {[this.getReadableDistance()]}m</div>"
          }, {
            getReadableDistance: function(dist) {
              if (dist > 1000) {
                return parseInt(dist / 100) / 10 + "km";
              } else {
                return dist + "m";
              }
            }
          }, {
            title: "Bikes"
          }, {
            title: "Docks"
          }
        ]
      });
      favoritesPanel = new Ext.Panel({
        title: "Favorites",
        iconCls: "favorites"
      });
      panel = new Ext.TabPanel({
        fullscreen: true,
        animation: false,
        tabBar: {
          dock: 'bottom',
          ui: 'light',
          layout: {
            pack: 'center'
          }
        },
        items: [mapPanel, searchPanel, favoritesPanel]
      });
      console.log("Socket.io", io);
      socket = io.connect();
      return socket.on('delta', function(deltas) {
        var delta, id, station, _results;
        console.log("Received deltas", deltas);
        console.log("Store", stationStore);
        _results = [];
        for (id in deltas) {
          delta = deltas[id];
          station = stationStore.getById(parseInt(id));
          station.set(delta);
          _results.push(station.get('marker').render().bounce());
        }
        return _results;
      });
    }
  });
  /*
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
  */
}).call(this);
