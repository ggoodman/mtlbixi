(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  window.Station = (function() {
    function Station() {
      Station.__super__.constructor.apply(this, arguments);
    }
    __extends(Station, Backbone.Model);
    return Station;
  })();
  window.Stations = (function() {
    function Stations() {
      Stations.__super__.constructor.apply(this, arguments);
    }
    __extends(Stations, Backbone.Collection);
    Stations.prototype.url = '/stations.json';
    Stations.prototype.model = Station;
    Stations.prototype.initialize = function() {};
    return Stations;
  })();
  window.Stations = new Stations;
  window.Marker = (function() {
    function Marker() {
      this.updatePosition = __bind(this.updatePosition, this);;
      this.updateName = __bind(this.updateName, this);;
      this.updateMarker = __bind(this.updateMarker, this);;
      this.render = __bind(this.render, this);;      Marker.__super__.constructor.apply(this, arguments);
    }
    __extends(Marker, Backbone.View);
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
    Marker.prototype.initialize = function() {
      this.model.view = this;
      this.model.bind('change', this.render);
      this.el = new google.maps.Marker({
        shadow: Marker.markerShadow,
        shape: Marker.markerShape,
        map: null
      });
      return this.render;
    };
    Marker.prototype.render = function() {
      this.updateMarker();
      this.updatePosition();
      this.updateName();
      return this;
    };
    Marker.prototype.updateMarker = function() {
      if (this.model.get('locked')) {
        this.el.setIcon(Marker.markerLocked);
      } else if (this.model.get('free') && this.model.get('bikes')) {
        this.el.setIcon(Marker.markerMixed);
      } else if (this.model.get('free')) {
        this.el.setIcon(Marker.markerEmpty);
      } else {
        this.el.setIcon(Marker.markerFull);
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
  window.StationMap = (function() {
    function StationMap() {
      this.render = __bind(this.render, this);;      StationMap.__super__.constructor.apply(this, arguments);
    }
    __extends(StationMap, Backbone.View);
    StationMap.prototype.initialize = function() {
      var self;
      self = this;
      this.el = new google.maps.Map(document.getElementById("map_canvas"), {
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false
      });
      this.location = null;
      Stations.bind('refresh', function(stations) {
        return stations.each(function(station) {
          var view;
          return view = new Marker({
            model: station
          });
        });
      });
      return jQuery.when(this.fetchLocation(), this.fetchStations()).then(function(loc) {
        google.maps.event.addListener(self.el, 'idle', self.render);
        self.el.setCenter(loc);
        return self.render();
      });
    };
    StationMap.prototype.render = function() {
      var self;
      self = this;
      return Stations.each(function(station) {
        var marker, _ref;
        marker = station.view.render().el;
        if ((_ref = self.el.getBounds()) != null ? _ref.contains(marker.getPosition()) : void 0) {
          if (!marker.getMap()) {
            return marker.setMap(self.el);
          }
        } else {
          return marker.setMap(null);
        }
      });
    };
    StationMap.prototype.fetchStations = function() {
      return jQuery.Deferred(function(dfr) {
        return Stations.fetch({
          success: function() {
            return dfr.resolve();
          },
          error: dfr.reject
        });
      }).promise();
    };
    StationMap.prototype.fetchLocation = function() {
      return jQuery.Deferred(function(dfr) {
        var montreal;
        montreal = new google.maps.LatLng(45.508903, -73.554153);
        if (navigator.geolocation) {
          return navigator.geolocation.getCurrentPosition(function(pos) {
            return dfr.resolve(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
          }, function() {
            return dfr.resolve(montreal);
          });
        } else {
          return dfr.resolve(montreal);
        }
      }).promise();
    };
    return StationMap;
  })();
  $(function() {
    var socket;
    socket = io.connect('http://mtlbixi.ggoodman.c9.io');
    socket.on('initial', function(data) {
      return console.log.apply(console, ['initial:'].concat(__slice.call(arguments)));
    });
    socket.on('bikes', function() {
      return console.log.apply(console, ['bikes:'].concat(__slice.call(arguments)));
    });
    return window.Map = new StationMap;
  });
}).call(this);
