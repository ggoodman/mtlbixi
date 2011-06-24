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
    __extends(Station, Backbone.Model);
    function Station() {
      Station.__super__.constructor.apply(this, arguments);
    }
    Station.prototype.initialize = function() {
      return this.history = new StationHistory;
    };
    return Station;
  })();
  window.StationEvent = (function() {
    __extends(StationEvent, Backbone.Model);
    function StationEvent() {
      StationEvent.__super__.constructor.apply(this, arguments);
    }
    return StationEvent;
  })();
  window.StationHistory = (function() {
    __extends(StationHistory, Backbone.Collection);
    function StationHistory() {
      StationHistory.__super__.constructor.apply(this, arguments);
    }
    StationHistory.prototype.model = StationEvent;
    StationHistory.prototype.pushBikeEvent = function(bikes, prevBikes) {
      var abs, delta, evt, inout, plural, werewas, _ref, _ref2;
      delta = bikes - prevBikes;
      abs = Math.abs(delta);
      inout = (_ref = delta > 0) != null ? _ref : {
        "in": "out"
      };
      plural = (_ref2 = abs > 1) != null ? _ref2 : {
        "s": ""
      };
      werewas = plural != null ? plural : {
        "were": "was"
      };
      evt = this.add({
        message: "" + abs + " bike {#plural} checked " + inout,
        time: new Date
      });
      return console.log("Bike event added", evt);
    };
    return StationHistory;
  })();
  window.BikeNetwork = (function() {
    __extends(BikeNetwork, Backbone.Collection);
    function BikeNetwork() {
      BikeNetwork.__super__.constructor.apply(this, arguments);
    }
    BikeNetwork.prototype.model = Station;
    BikeNetwork.prototype.url = '/stations.json';
    return BikeNetwork;
  })();
  window.Marker = (function() {
    __extends(Marker, Backbone.View);
    function Marker() {
      this.bounceMarker = __bind(this.bounceMarker, this);
      this.render = __bind(this.render, this);
      Marker.__super__.constructor.apply(this, arguments);
    }
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
      this.history = new StationHistory;
      this.model.bind('change:bikes', __bind(function() {
        this.updateMarker();
        return this.history.pushBikeEvent(this.model.get('bikes'), this.model.previous('bikes'));
      }, this));
      this.model.bind('change', __bind(function() {
        this.render();
        return this.bounceMarker();
      }, this));
      return this.el = new google.maps.Marker({
        shadow: Marker.markerShadow,
        shape: Marker.markerShape
      });
    };
    Marker.prototype.render = function() {
      this.updateMarker();
      this.updatePosition();
      this.updateName();
      return this;
    };
    Marker.prototype.bounceMarker = function() {
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
  window.Application = (function() {
    __extends(Application, Backbone.View);
    function Application() {
      this.render = __bind(this.render, this);
      Application.__super__.constructor.apply(this, arguments);
    }
    Application.prototype.initialize = function() {
      var self;
      self = this;
      this.el = new google.maps.Map(document.getElementById("map_canvas"), {
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        center: null,
        streetViewControl: false
      });
      this.collection.bind('refresh', function(coll) {
        coll.each(function(station) {
          var view;
          return view = new Marker({
            model: station
          });
        });
        return self.render();
      });
      return jQuery.when(this.fetchLocation(), this.fetchStations()).then(function(loc, stations) {
        console.log("Deferred resolved", arguments);
        google.maps.event.addListener(self.el, 'idle', self.render);
        self.el.setCenter(loc);
        self.render();
        return self.collection.refresh(stations);
      });
    };
    Application.prototype.render = function() {
      var self;
      self = this;
      return self.collection.each(function(station) {
        var marker;
        marker = station.view.render().el;
        if (self.el.getBounds().contains(marker.getPosition())) {
          if (!marker.getMap()) {
            return marker.setMap(self.el);
          }
        } else {
          return marker.setMap(null);
        }
      });
    };
    Application.prototype.fetchLocation = function() {
      var self;
      self = this;
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
    Application.prototype.fetchStations = function() {
      var self;
      self = this;
      this.socket = io.connect();
      this.socket.on('delta', function(deltas) {
        var delta, id, _results;
        console.log.apply(console, ["Received deltas"].concat(__slice.call(arguments)));
        _results = [];
        for (id in deltas) {
          delta = deltas[id];
          _results.push(self.collection.get(id).set(delta));
        }
        return _results;
      });
      return jQuery.Deferred(function(dfr) {
        return self.socket.emit('fetch', function(stations) {
          return dfr.resolve(_.values(stations));
        });
      }).promise();
    };
    return Application;
  })();
  $(function() {
    var app;
    return app = new Application({
      collection: new BikeNetwork
    });
  });
}).call(this);
