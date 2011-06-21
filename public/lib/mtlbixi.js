$(function(){
  var options = {
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    streetViewControl: false
  };
  
  var map = new google.maps.Map(document.getElementById("map_canvas"), options);
  var markers = {};
  var stations = {};
  var windows = {};
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
            
            if (!marker) {
              marker = markers[station.id] = new google.maps.Marker({
                icon: station.locked ? markerLocked : (station.bikes ? (station.free ? markerMixed : markerEmpty) : markerFull),
                shadow: markerShadow,
                shape: markerShape,
                position: new google.maps.LatLng(station.loc.lat, station.loc.lng), 
                map: null, 
                title: station.name
              });
              
              google.maps.event.addListener(marker, 'click', function() {
                var info = windows[station.id] = new google.maps.InfoWindow({
                  content: "<strong>" + station.name + "</strong><p>Bikes: " + station.bikes + " / " + (station.bikes + station.free) + "</p>"
                });
                
                info.open(map, marker);
              });
            }
            
            if (stations[station.id] && stations[station.id] != station) {
              marker.setIcon(station.locked ? markerLocked : (station.bikes ? (station.free ? markerMixed : markerEmpty) : markerFull));
              marker.setPosition(new google.maps.LatLng(station.loc.lat, station.loc.lng));
              marker.setAnimation(google.maps.Animation.BOUNCE);
              
              // Update the info window contents
              windows[station.id].setContent("<strong>" + station.name + "</strong><p>Bikes: " + station.bikes + " / " + (station.bikes + station.free) + "</p>");
            } else {
              // Stop any outstanding animations
              markers[station.id].setAnimation(null);
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
