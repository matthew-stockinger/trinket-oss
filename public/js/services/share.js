(function(angular, trinketIO) {
  angular.module('trinket.share', [])
    .factory('trinketShare', function() {
      return trinketIO.import("trinket.share");
    });
})(window.angular, window.TrinketIO);
