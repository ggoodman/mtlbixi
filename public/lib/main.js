(function() {
  var fixgeometry;
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
    Marker.markerLocked = new google.maps.MarkerImage('/img/marker-disabled.png', Marker.markerSize, Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerShadow = new google.maps.MarkerImage('/img/marker-shadow.png', new google.maps.Size(46, 23), Marker.markerTopLeft, Marker.markerBottomRight);
    Marker.markerShape = {
      coord: [19, 0, 21, 1, 22, 2, 22, 3, 23, 4, 23, 5, 24, 6, 24, 7, 24, 8, 24, 9, 24, 10, 24, 11, 24, 12, 23, 13, 23, 14, 22, 15, 21, 16, 20, 17, 19, 18, 18, 19, 17, 20, 16, 21, 15, 22, 15, 22, 14, 21, 13, 20, 12, 19, 11, 18, 9, 17, 8, 16, 7, 15, 7, 14, 6, 13, 6, 12, 6, 11, 6, 10, 6, 9, 6, 8, 6, 7, 6, 6, 6, 5, 7, 4, 7, 3, 8, 2, 9, 1, 11, 0, 19, 0],
      type: 'poly'
    };
    Marker.prototype.initialize = function() {
      this.el = new google.maps.Marker({
        shadow: Marker.markerShadow,
        shape: Marker.markerShape,
        position: this.model.get('pos')
      });
      return google.maps.event.addListener(this.el, 'click', __bind(function() {
        return console.log("Model", this.model.getId(), this.model);
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
    return Station;
  })();
  this.Stations = (function() {
    __extends(Stations, Backbone.Collection);
    function Stations() {
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
          var row, station, _i, _len, _ref, _results;
          if (!me.length) {
            return me.refresh(json.query.results.stations.station);
          } else {
            _ref = json.query.results.stations.station;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              row = _ref[_i];
              _results.push((station = me.get(row.id)) ? station.set(row) : me.add(row));
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
      return this.el = new google.maps.Map(document.getElementById('map_canvas'), gmapOptions);
    };
    StationMap.prototype.render = function() {
      return this;
    };
    return StationMap;
  })();
  fixgeometry = function() {
    var content, content_height, footer, header, viewport_height;
    scroll(0, 1);
    header = $("div[data-role=header]:visible");
    footer = $("div[data-role=footer]:visible");
    content = $("div[data-role=content]:visible");
    viewport_height = $(window).height();
    content_height = viewport_height - header.outerHeight() - footer.outerHeight();
    content_height -= content.outerHeight() - content.height();
    return content.height(content_height);
  };
  $(function() {
    var map, stations;
    $(window).bind("orientationchange resize pageshow", fixgeometry);
    map = new StationMap;
    stations = new Stations;
    return stations.fetch();
  });
}).call(this);
