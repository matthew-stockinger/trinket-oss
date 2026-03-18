(function(angular) {
  'use strict';

  angular.module('focusMe', []).directive('focusMe', ['$timeout', '$parse', function($timeout, $parse) {
    return {
      link: function (scope, element, attrs) {
        var model = $parse(attrs.focusMe);
        scope.$watch(model, function(value, old) {
          if (value === true) {
            $timeout(function() {
              element[0].focus();
            }, 500);
          }
        });
      }
    };
  }]);
})(window.angular);
