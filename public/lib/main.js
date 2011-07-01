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
      this.el.setPosition(new google.maps.LatLng(this.model.get('lat'), this.model.get('long')));
      return this;
    };
    return Marker;
  })();
  Ext.setup({
    onReady: function() {
      var closestFilters, currentLocation, geoloc, initialLoad, locationSupported, map, mapPanel, panel, refreshDistances, refreshStations, renderVisibleMarkers, stationList, stationListPanel, stationStore;
      locationSupported = false;
      currentLocation = new google.maps.LatLng(45.508903, -73.554153);
      initialLoad = true;
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
            type: 'int',
            mapping: 'nbBikes'
          }, {
            name: 'free',
            type: 'int',
            mapping: 'nbEmptyDocks'
          }, {
            name: 'lat',
            type: 'float'
          }, {
            name: 'long',
            type: 'float'
          }, {
            name: 'distance',
            type: 'int',
            "default": void 0
          }, {
            name: 'pos',
            convert: function(v, r) {
              return new google.maps.LatLng(r.get('lat'), r.get('long'));
            }
          }, {
            name: 'marker',
            convert: function(v, r) {
              return new Marker(r);
            }
          }
        ]
      });
      /*
          stationStore = new Ext.data.Store
            model: 'Station'
            proxy:
              type: 'localstorage'
              id: 'mtlbixi.stations'
            autoLoad: true
            listeners:
              update: (self, record, op) ->
                record.marker.render().bounce()
          */
      stationStore = new Ext.data.Store({
        model: 'Station',
        proxy: {
          type: 'scripttag',
          url: 'http://query.yahooapis.com/v1/public/yql?q=select%20station%20from%20xml%20where%20url%3D%22http%3A%2F%2Fprofil.bixi.ca%2Fdata%2FbikeStations.xml%22&format=json',
          reader: {
            type: 'json',
            root: 'query.results.stations',
            record: 'station'
          }
        },
        autoLoad: true,
        sorters: 'distance',
        listeners: {
          load: function(self, records, succeeded) {
            var record, _i, _len;
            for (_i = 0, _len = records.length; _i < _len; _i++) {
              record = records[_i];
              record.commit(true);
            }
            return refreshDistances();
          },
          update: function(self, record, op) {
            if (!initialLoad) {
              record.get('marker').render().bounce();
            }
            return initialLoad = false;
          }
        }
      });
      stationList = {
        xtype: 'list',
        store: stationStore,
        itemTpl: '<div class="mb-station-list mb-station-closest">\
                  <h3>\
                    {name}\
                    <tpl if="favorite"><span class="mb-star mb-star-selected">&#9733</span></tpl>\
                  </h3>\
                  <div class="mb-station-info">\
                    <strong>Bikes:</strong> {bikes}\
                    <strong>Free docks:</strong> {free}\
                    <strong>Distance:</strong> {[values.distance > 1000 ? Math.round(values.distance / 100) / 10 + "km" : values.distance + "m"]}\
                  </div>\
                </div>'
      };
      closestFilters = {
        xtype: "segmentedbutton",
        items: [
          {
            text: "Bikes",
            pressed: true,
            handler: function() {
              stationStore.clearFilter();
              stationStore.filterBy(function(record) {
                return record.get('bikes') > 0;
              });
              return stationStore.sort();
            }
          }, {
            text: "Docks",
            handler: function() {
              stationStore.clearFilter();
              stationStore.filterBy(function(record) {
                return record.get('free') > 0;
              });
              return stationStore.sort();
            }
          }
        ]
      };
      stationListPanel = {
        xtype: 'panel',
        title: 'Nearest',
        iconCls: 'search',
        items: [stationList],
        dockedItems: [
          {
            xtype: "toolbar",
            items: [closestFilters],
            layout: {
              pack: "center"
            }
          }
        ]
      };
      renderVisibleMarkers = function(gmap) {
        return stationStore.each(function(station) {
          var marker;
          marker = station.get('marker').render().el;
          if (gmap.getBounds().contains(marker.getPosition())) {
            if (!marker.getMap()) {
              return marker.setMap(gmap);
            }
          } else {
            return marker.setMap(null);
          }
        });
      };
      map = {
        xtype: "map",
        id: "map",
        useCurrentLocation: true,
        mapOptions: {
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          streetViewControl: false
        },
        listeners: {
          beforeshow: function() {
            return stationStore.clearFilter();
          },
          maprender: function(self, gmap) {
            return google.maps.event.addListener(gmap, 'idle', function() {
              return renderVisibleMarkers(gmap);
            });
          }
        }
      };
      mapPanel = {
        xtype: "panel",
        title: "Map",
        iconCls: "maps",
        items: [map]
      };
      closestFilters = {
        xtype: "segmentedbutton",
        items: [
          {
            text: "Bikes",
            pressed: true,
            handler: function() {
              stationStore.clearFilter();
              return stationStore.filterBy(function(record) {
                return record.get('bikes') > 0;
              });
            }
          }, {
            text: "Docks",
            handler: function() {
              stationStore.clearFilter();
              return stationStore.filterBy(function(record) {
                return record.get('free') > 0;
              });
            }
          }
        ]
      };
      panel = new Ext.TabPanel({
        fullscreen: true,
        tabBar: {
          dock: 'bottom',
          ui: 'light',
          layout: {
            pack: 'center'
          }
        },
        items: [stationListPanel, mapPanel]
      });
      refreshDistances = function() {
        stationStore.each(function(station) {
          return station.set('distance', google.maps.geometry.spherical.computeDistanceBetween(station.get('pos'), currentLocation));
        });
        return stationStore.sort();
      };
      geoloc = new Ext.util.GeoLocation({
        autoUpdate: true,
        listeners: {
          locationupdate: function(self) {
            currentLocation = new google.maps.LatLng(self.latitude, self.longitude);
            return refreshDistances();
          },
          locationerror: function(self, timeout, permission) {
            return currentLocation = new google.maps.LatLng(45.508903, -73.554153);
          }
        }
      });
      refreshDistances = function() {
        stationStore.each(function(station) {
          return station.set('distance', google.maps.geometry.spherical.computeDistanceBetween(station.get('pos'), currentLocation));
        });
        return stationStore.sort();
      };
      refreshStations = function() {
        stationStore.each(function(station) {
          return station.commit(true);
        });
        console.log("Changed records", stationStore.getUpdatedRecords());
        return stationStore.sync();
      };
      return setTimeout(refreshStations, 1000 * 15);
    }
  });
}).call(this);
