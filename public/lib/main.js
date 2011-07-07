(function() {
  var BikeApp, fixgeometry;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  this.Marker = (function() {
    __extends(Marker, Backbone.View);
    function Marker() {
      this.bounce = __bind(this.bounce, this);
      this.render = __bind(this.render, this);
      Marker.__super__.constructor.apply(this, arguments);
    }
    Marker.markerSize = new google.maps.Size(30, 23);
    Marker.markerTopLeft = new google.maps.Point(0, 0);
    Marker.markerBottomRight = new google.maps.Point(15, 23);
    Marker.markerMixed = new google.maps.MarkerImage('/img/marker-mixed.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerEmpty = new google.maps.MarkerImage('/img/marker-empty.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerFull = new google.maps.MarkerImage('/img/marker-full.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerLocked = new google.maps.MarkerImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAXCAYAAAAcP/9qAAACOklEQVR42sWVS4saQRDHfb8f4/uBD9CDeBBZxMdBjQYDejIHBSUQPAoDouBVWFD0IvoR9lvsdW85bs57Wrwse1nIXkKQhEpXQw/DRMj2rMkW/BmY7qlfdVV1jUbDYc1m83Mmk/kSCASejUYjmM1mcLlcv5LJ5FO5XL4WRfGD5pw2GAwufD7fQa/Xg9VqBbfbDX6/H4LBIIRCIfrMZrOw2+0et9vtZrlcpl8Nrdfrn3Q63dFgMODpKCQSiUAsFoN4PE6VTqdhs9nAfr8HcmpIJBIP4/H4vWporVZ7Rx5HPCmekkGVmk6nFLpYLMBkMgEJFHK53EE12G6348dgs9nA6/XS9Co1HA4pFEVqD2w/ZocEPOKGkohFdILROxwOemKlSENJ0Hw+T6GYHbafNN89N1gQhFvmCBtKqVQqBev1mkJ7vR6ForDb2R6LxYLvPvKyj+hIq9UCNpZcTqcT5vM5hc5mMwnKMiTfS95dclGLxeIzubfQarX+0Gg0klLc7XahWq2CfG+hUJAHc8MFJnfyJ3OuRpgVVWBS2x/YJOiAqVKpSI4bjQatI3Yw7guHw9IaGSDqT0zsu7x2qNVqRR33+31QruH1YWAcLrK1S17wrdzxZDKRHGNNsY6lUolmAcWCIkNHGRRfV0ejUZF9jJ39krq2220l9F7t8LpjTjweDx0SZLCcFNZamX41d5hap9O5II9vJxz+VSSQw2t/UALRV07w1bl+yQIn+Oz2JtCXwP+5vQn0FPy/m2robxiKwut7SnMmAAAAAElFTkSuQmCC', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerShadow = new google.maps.MarkerImage('/img/marker-shadow.png', new google.maps.Size(46, 23), Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerShape = {
      coord: [19, 0, 21, 1, 22, 2, 22, 3, 23, 4, 23, 5, 24, 6, 24, 7, 24, 8, 24, 9, 24, 10, 24, 11, 24, 12, 23, 13, 23, 14, 22, 15, 21, 16, 20, 17, 19, 18, 18, 19, 17, 20, 16, 21, 15, 22, 15, 22, 14, 21, 13, 20, 12, 19, 11, 18, 9, 17, 8, 16, 7, 15, 7, 14, 6, 13, 6, 12, 6, 11, 6, 10, 6, 9, 6, 8, 6, 7, 6, 6, 6, 5, 7, 4, 7, 3, 8, 2, 9, 1, 11, 0, 19, 0],
      type: 'poly'
    };
    Marker.prototype.initialize = function() {
      this.el = new google.maps.Marker({
        shadow: Marker.markerShadow,
        shape: Marker.markerShape,
        position: new google.maps.LatLng(this.model.get('lat'), this.model.get('long'))
      });
      this.render();
      this.model.bind('change', __bind(function() {
        this.render();
        return this.bounce();
      }, this));
      return google.maps.event.addListener(this.el, 'click', __bind(function() {
        return console.log("Model", this.model.get('id'), this.model);
      }, this));
    };
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
      this.el.setPosition(new google.maps.LatLng(this.model.get('lat'), this.model.get('long')));
      return this;
    };
    return Marker;
  })();
  this.Station = (function() {
    __extends(Station, Backbone.Model);
    function Station() {
      Station.__super__.constructor.apply(this, arguments);
    }
    Station.prototype.initialize = function() {
      return this.marker = new Marker({
        model: this
      });
    };
    return Station;
  })();
  this.Stations = (function() {
    __extends(Stations, Backbone.Collection);
    function Stations() {
      this.fetch = __bind(this.fetch, this);
      Stations.__super__.constructor.apply(this, arguments);
    }
    Stations.prototype.model = Station;
    Stations.prototype.fetch = function() {
      var me;
      me = this;
      return jQuery.ajax({
        url: "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D%22http%3A%2F%2Fprofil.bixi.ca%2Fdata%2FbikeStations.xml%22&format=json",
        dataType: "jsonp",
        success: function(json) {
          var data, parseStation, station, _i, _len, _ref, _results;
          parseStation = function(data) {
            return {
              id: parseInt(data.id),
              name: data.name,
              bikes: parseInt(data.nbBikes),
              free: parseInt(data.nbEmptyDocks),
              lat: parseFloat(data.lat),
              long: parseFloat(data.long),
              locked: data.locked === "true"
            };
          };
          if (!me.length) {
            return me.refresh(_(json.query.results.stations.station).map(parseStation));
          } else {
            _ref = json.query.results.stations.station;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              data = _ref[_i];
              station = parseStation(data);
              _results.push(me.get(station.id).set(station));
            }
            return _results;
          }
        }
      });
    };
    return Stations;
  })();
  this.StationMap = (function() {
    __extends(StationMap, Backbone.View);
    function StationMap() {
      this.render = __bind(this.render, this);
      StationMap.__super__.constructor.apply(this, arguments);
    }
    StationMap.prototype.initialize = function() {
      var gmapOptions;
      gmapOptions = {
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        center: new google.maps.LatLng(45.508903, -73.554153),
        streetViewControl: false
      };
      this.gmap = new google.maps.Map(document.getElementById('map_canvas'), gmapOptions);
      this.collection.bind('refresh', this.render);
      this.collection.bind('update', this.render);
      this.collection.bind('add', this.render);
      this.collection.bind('remove', this.render);
      return google.maps.event.addListener(this.gmap, 'idle', __bind(function() {
        return this.render();
      }, this));
    };
    StationMap.prototype.render = function() {
      var bounds, gmap;
      gmap = this.gmap;
      bounds = gmap.getBounds();
      this.collection.each(function(station) {
        var marker;
        marker = station.marker.render().el;
        if (bounds.contains(marker.getPosition())) {
          if (!marker.getMap()) {
            return marker.setMap(gmap);
          }
        } else {
          return marker.setMap(null);
        }
      });
      return this;
    };
    return StationMap;
  })();
  BikeApp = (function() {
    __extends(BikeApp, Backbone.View);
    function BikeApp() {
      BikeApp.__super__.constructor.apply(this, arguments);
    }
    BikeApp.prototype.initialize = function() {
      this.stations = new Stations;
      this.map = new StationMap({
        collection: this.stations
      });
      this.stations.fetch();
      return setInterval(this.stations.fetch, 1000 * 20);
    };
    return BikeApp;
  })();
  fixgeometry = function() {
    var content, content_height, footer, header, viewport_height;
    scroll(0, 0);
    header = $("div[data-role=header]:visible");
    footer = $("div[data-role=footer]:visible");
    content = $("div[data-role=content]:visible");
    viewport_height = $(window).height();
    content_height = viewport_height - header.outerHeight() - footer.outerHeight();
    content_height -= content.outerHeight() - content.height();
    return content.height(content_height);
  };
  $(function() {
    var app;
    $(window).bind("orientationchange resize pageshow", fixgeometry);
    return app = new BikeApp;
  });
}).call(this);
