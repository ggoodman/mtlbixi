$(function(){
  var latlng = new google.maps.LatLng(45.476877,-73.625357);
  var options = {
    zoom: 15,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("map_canvas"),
      options);

  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(map);
  jQuery.ajax({
    url: "/stations.json",
    dataType: "json",
    success: function(data) {
      jQuery.each(data, function(i, station) {
        var image = new google.maps.MarkerImage(
          '/img/marker-image.png',
          new google.maps.Size(30,23),
          new google.maps.Point(0,0),
          new google.maps.Point(15,23)
        );
        
        var shadow = new google.maps.MarkerImage(
          '/img/marker-shadow.png',
          new google.maps.Size(46,23),
          new google.maps.Point(0,0),
          new google.maps.Point(15,23)
        );
        
        var shape = {
          coord: [19,0,21,1,22,2,22,3,23,4,23,5,24,6,24,7,24,8,24,9,24,10,24,11,24,12,23,13,23,14,22,15,21,16,20,17,19,18,18,19,17,20,16,21,15,22,15,22,14,21,13,20,12,19,11,18,9,17,8,16,7,15,7,14,6,13,6,12,6,11,6,10,6,9,6,8,6,7,6,6,6,5,7,4,7,3,8,2,9,1,11,0,19,0],
          type: 'poly'
        };
        /*
        var label = new Label({
          position: new google.maps.LatLng(station.loc.lat, station.loc.lng), 
          map: map, 
          text: station.name
        });
        */
        var info = new google.maps.InfoWindow({
          content: "<h1>" + station.name + "</h1><p>Bikes:" + station.bikes + "/" + (station.bikes + station.free) + "</p>"
        });
        var marker = new google.maps.Marker({
          animation: google.maps.Animation.DROP,
          icon: image,
          shadow: shadow,
          shape: shape,
          position: new google.maps.LatLng(station.loc.lat, station.loc.lng), 
          map: map, 
          title: station.name
        });
        
        google.maps.event.addListener(marker, 'click', function() {
          info.open(map, marker);
        });
      });
    }
  });
});
