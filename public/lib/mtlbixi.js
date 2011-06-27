(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
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
      Ext.Anim.override({
        disableAnimations: true
      });
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
        data: stations,
        sorters: 'name',
        getGroupString: function(record) {
          return record.get('name')[0];
        }
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
        return stationStore.each(function(station) {
          var distance;
          distance = google.maps.geometry.spherical.computeDistanceBetween(position, station.get('pos'));
          return station.set('distance', distance);
        });
      });
      mapPanel = new Ext.Panel({
        title: "Map",
        iconCls: "maps",
        dockedItems: [mapToolbar],
        items: [map]
      });
      searchPanel = new Ext.TabPanel({
        title: "Stations",
        iconCls: "search",
        tabBar: {
          layout: {
            pack: 'center'
          }
        },
        defaults: {
          store: stationStore,
          xtype: 'list',
          itemSelector: 'div.id',
          itemTpl: '<div class="mtlbixi-station" id="{id}">\
                  <h3>{name}</h3>\
                  <strong>Bikes:</strong> {bikes}\
                  <strong>Free docks:</strong> {free}\
                  <strong>Distance:</strong> {[values.distance > 1000 ? Math.round(values.distance / 100) / 10 + "km" : values.distance + "m"]}\
                  </div>',
          listeners: {
            refresh: function(list) {
              return list.getEl().select("div.mtlbixi-station").each(function(node) {
                var record, starButton, wrapper;
                record = list.getRecord(node);
                console.log("Record", node, record);
                starButton = new Ext.Button({
                  iconCls: "favorites",
                  pressed: true
                });
                return wrapper = new Ext.SegmentedButton({
                  allowMultiple: true,
                  defaults: {
                    iconMask: true,
                    ui: "plain"
                  },
                  items: [starButton],
                  renderTo: node,
                  handler: function(btn, e) {
                    return console.log.apply(console, ["Clicked"].concat(__slice.call(arguments)));
                  }
                });
              });
            }
          }
        },
        listeners: {
          beforecardswitch: function(cmp, newCard, oldCard, index, animated) {
            console.log.apply(console, ["cardswitch"].concat(__slice.call(arguments)));
            if (newCard.title === "All") {
              return stationStore.sort('name', 'ASC');
            } else if (oldCard.title === "All") {
              return stationStore.sort('distance', 'ASC');
            }
          }
        },
        items: [
          {
            title: "All",
            grouped: true,
            indexBar: true
          }, {
            title: "Bikes",
            collectData: function(records, start) {
              var record, _i, _len, _ref, _results;
              _ref = records.slice(0, 5);
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                record = _ref[_i];
                if (record.get('bikes') > 0) {
                  _results.push(record.data);
                }
              }
              return _results;
            }
          }, {
            title: "Docks",
            collectData: function(records, start) {
              var record, _i, _len, _ref, _results;
              _ref = records.slice(0, 5);
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                record = _ref[_i];
                if (record.get('free') > 0) {
                  _results.push(record.data);
                }
              }
              return _results;
            }
          }
        ]
      });
      favoritesPanel = new Ext.Panel({
        title: "Favorites",
        iconCls: "favorites"
      });
      panel = new Ext.TabPanel({
        fullscreen: true,
        defaults: {
          animation: false
        },
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
}).call(this);
