(function(angular) {
  'use strict';

  angular.module('assignment.dashboard', []).directive('assignmentDashboard', [function() {
    function link(scope) {
      scope.$watch("assignment", function(newValue, oldValue) {
        var pctTotal    = 0
          , pctMax      = 0
          , pctMaxState = ""
          , pctDiff
          , totalKey = scope.totalKey || 'user-count';

        if (newValue) {
          angular.forEach(['not-started', 'started', 'submitted', 'completed'], function(state) {
            var pct = 100 * ( newValue[state] / newValue[totalKey] );
            scope.assignment[state + '-pct'] = Math.round(10 * pct) / 10;

            pctTotal += scope.assignment[state + '-pct'];
            if (scope.assignment[state + '-pct'] > pctMax) {
              pctMax = scope.assignment[state + '-pct'];
              pctMaxState = state;
            }
          });

          // normalize to 100
          if (pctTotal > 100) {
            pctDiff = pctTotal - 100;
            scope.assignment[pctMaxState + '-pct'] -= pctDiff;
          }
        }
      });
    }

    return {
        restrict    : 'E'
      , templateUrl : '/partials/directives/assignment-dashboard.html'
      , link        : link
      , scope       : {
          assignment : '=',
          totalKey   : '=?'
        }
    };
  }]);
})(window.angular);
