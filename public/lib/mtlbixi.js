$(function(){
  var options = {
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    streetViewControl: false
  };
  
  var map = new google.maps.Map(document.getElementById("map_canvas"), options);
  var markers = {};
  var stations = {};
  var infos = {};
  var location = null;

  //var bikeLayer = new google.maps.BicyclingLayer();
  //bikeLayer.setMap(map);
  
  var renderMarkers = function(){
    var count = 0;
    jQuery.each(markers, function(i, marker) {
      var bounds = map.getBounds();
      
      if (bounds.contains(marker.getPosition())) {
        if (!marker.getMap()) marker.setMap(map);
        count++;
      } else {
        marker.setMap(null);
      }
    });
  };
  
  var init = function(location) {
    console.log("Location", location);
    google.maps.event.addListener(map, 'idle', renderMarkers);
    map.setCenter(location);
    
    renderMarkers(markers);
  };
  
  var fetchLocation = function() {
    return jQuery.Deferred(function(deferred){
      var montreal = new google.maps.LatLng(45.508903,-73.554153); //Default to Montreal, QC, Canada
  
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          deferred.resolve(location);
        }, function() {
          deferred.resolve(montreal);
        });
      } else {
        deferred.resolve(montreal);
      }
      
    }).promise();
  };
  
  var fetchMarkers = function() {
    console.log("Fetching markers");
    return jQuery.Deferred(function(deferred){
      
      jQuery.ajax({
        url: "/stations/",
        dataType: "json",
        error: deferred.reject,
        success: function(data) {
          var markerSize = new google.maps.Size(30,23)
            , markerTopLeft = new google.maps.Point(0,0)
            , markerBottomRight = new google.maps.Point(15,23);
          var markerMixed = new google.maps.MarkerImage(
            '/img/marker-mixed.png',
            markerSize,
            markerTopLeft,
            markerBottomRight
          );
          var markerEmpty = new google.maps.MarkerImage(
            '/img/marker-empty.png',
            markerSize,
            markerTopLeft,
            markerBottomRight
          );
          var markerFull = new google.maps.MarkerImage(
            '/img/marker-full.png',
            markerSize,
            markerTopLeft,
            markerBottomRight
          );
          var markerLocked = new google.maps.MarkerImage(
            '/img/marker-disabled.png',
            markerSize,
            markerTopLeft,
            markerBottomRight
          );
          var markerShadow = new google.maps.MarkerImage(
            '/img/marker-shadow.png',
            new google.maps.Size(46,23),
            markerTopLeft,
            markerBottomRight
          );
          var markerShape = {
            coord: [19,0,21,1,22,2,22,3,23,4,23,5,24,6,24,7,24,8,24,9,24,10,24,11,24,12,23,13,23,14,22,15,21,16,20,17,19,18,18,19,17,20,16,21,15,22,15,22,14,21,13,20,12,19,11,18,9,17,8,16,7,15,7,14,6,13,6,12,6,11,6,10,6,9,6,8,6,7,6,6,6,5,7,4,7,3,8,2,9,1,11,0,19,0],
            type: 'poly'
          };            
          jQuery.each(data, function(i, station) {
            var marker = markers[station.id];
            var info = infos[station.id];
                        
            if (!marker) {
              marker = markers[station.id] = new google.maps.Marker({
                icon: station.locked ? markerLocked : (station.bikes ? (station.free ? markerMixed : markerEmpty) : markerFull),
                shadow: markerShadow,
                shape: markerShape,
                position: new google.maps.LatLng(station.loc.lat, station.loc.lng), 
                map: null, 
                title: station.name
              });
            }
            
            var buildContent = function(station) {
              var content = '<span class="station-name">' + station.name + '</span>';
              
              content += '<p>Bikes: <span class="station-bikes">' + station.bikes + '</span> / <span class="station-slots">' + (station.bikes + station.free) + '</span></p>';
              content += '<ul class="station-updates">';
              
              if (station.history) {
                jQuery.each(station.history, function(i, event) {
                  content += '<li>' + event + '</li>';
                });
              }
              
              content += '</ul>';
              
              return content;
            };
            
            if (!info) {
              var info = infos[station.id] = new google.maps.InfoWindow({
                content: buildContent(station)
              });
              
              google.maps.event.addListener(marker, 'click', function() {
                info.open(map, marker);
              });
            }
            
            if (stations[station.id]) {
              var old = stations[station.id]
                , changed = false;
              
              if (old.locked != station.locked) {
                marker.setIcon(station.locked ? markerLocked : (station.bikes ? (station.free ? markerMixed : markerEmpty) : markerFull));
                changed = station.name + " is now " + (station.locked ? "" : "un") + "locked.";
              }
              if (old.bikes != station.bikes || old.free != station.free) {
                marker.setIcon(station.locked ? markerLocked : (station.bikes ? (station.free ? markerMixed : markerEmpty) : markerFull));
                changed = station.name + " now has " + station.bikes + " of " + (station.bikes + station.free) + " bikes free.";
              }
              if (old.loc.lat != station.loc.lat || old.loc.lng != station.loc.lng) {
                marker.setPosition(new google.maps.LatLng(station.loc.lat, station.loc.lng));
                changed = station.name + " has changed coordinates.";
              }
              
              if (changed) {
                if (!station.history) station.history = [];
                
                station.history.push(changed);
                
                info.setContent(buildContent(station));
                console.log(changed);
                marker.setAnimation(google.maps.Animation.BOUNCE);
              } else {
                // Stop animating if no changes since last poll
                marker.setAnimation(null);
              }
            }

            // Update stations with new info
            stations[station.id] = station;
          });
          deferred.resolve();
        }
      });
    
    }).promise();
  };
  
  jQuery.when(fetchLocation(), fetchMarkers()).then(init);
  
  setInterval(function() {
    jQuery.when(fetchMarkers()).then(renderMarkers);
  }, 1000 * 60); // Re-fetch every minute

});
