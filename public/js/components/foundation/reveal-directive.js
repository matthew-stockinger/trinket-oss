(function(angular, module) {

function Reveal() {
  return {
    restrict: 'AC',
    scope: {
      close: '=?'
    },
    link: function (scope, element, attrs) {
      scope.close = function() {
        element.foundation('reveal', 'close');
      }

      element.find('.close-modal').on('click', function() {
        scope.close();
      });
    }
  }
}

module.directive('reveal', Reveal);

})(window.angular, window.angular.module('trinket.components.foundation', []));