(function(angular) {
  angular.module('trinket.util', [])
    .factory('trinketUtil', ['$window', function($window) {
      return {
        getProperty : function(obj, prop) {
          var path = prop.split('.');

          for(var i = 0; i < path.length; i++) {
            if (obj != null) {
              obj = obj[path[i]];
            }
          }

          return obj;
        },
        isElementVisible : function(elem, relativeTo) {
          if (!elem) return true;
          var off = elem.offset();
          if (!off) return true;
          var et = off.top;
          var eh = elem.height();
          var wh = $window.innerHeight;
          var wy = $window.pageYOffset;

          if (relativeTo && relativeTo.offset() && et < relativeTo.offset().top) {
            wy += relativeTo.offset().top;
          }

          return (et >= wy && et + eh <= wh + wy);
        },
        isLarge : function() {
          return matchMedia(Foundation.media_queries['large']).matches;
        }
      };
    }])
    .filter('formatNum', function() {
      return function(num) {
        with (Math) {
          var base = floor(log(abs(num))/log(1000));
          var suffix = 'kmb'[base-1];
          return suffix ? String(num/pow(1000,base)).substring(0,3)+suffix : ''+num;
        }
      };
    })
    .filter('formatDate', function() {
      return function(date) {
        return moment(date).subtract(2, 'seconds').fromNow();
      }
    })
    .filter('localDate', function() {
      return function(date) {
        return moment(date).local().format('LLLL');
      }
    })
    .filter('schoolDate', function() {
      var zone  = 'America/Chicago'
        , short = new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        , long  = new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });

      return function(date, tooltip) {
        var d = new Date(date);
        if (!date || isNaN(d)) return '';
        if (tooltip) return long.format(d);

        var p = {};
        short.formatToParts(d).forEach(function(part) { p[part.type] = part.value; });
        return p.weekday + ', ' + p.month + ' ' + p.day + ', ' + p.year + ' ' + p.hour + ':' + p.minute + ' ' + p.dayPeriod;
      }
    });
})(window.angular);
