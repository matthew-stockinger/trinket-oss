(function (angular) {
  'use strict';

  angular.module('trinket.calendar', []).directive('trinketCalendar', ['$timeout', function($timeout) {
    function link(scope, element, attrs, ctrl) {
      // Create a native date input next to the calendar icon
      var input = document.createElement('input');
      input.type = 'date';
      input.className = 'trinket-date-input';

      // Insert after the icon element
      element.after(input);

      // Format date as YYYY-MM-DD for input
      function formatDate(date) {
        if (!date) return '';
        var d = new Date(date);
        if (isNaN(d.getTime())) return '';
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
      }

      // Click on icon opens the date picker
      element.on('click', function() {
        input.showPicker ? input.showPicker() : input.focus();
      });

      // When date changes, update the model
      input.addEventListener('change', function() {
        scope.$apply(function() {
          scope.ngModel = input.value;
          ctrl.$setViewValue(input.value);
        });
      });

      // Watch for model changes
      scope.$watch('ngModel', function(value) {
        input.value = formatDate(value);
      });

      // Handle min date constraint
      scope.$watch('invalidBefore', function(value) {
        if (value) {
          input.min = formatDate(value);
        } else {
          input.removeAttribute('min');
        }
      });

      // Handle max date constraint
      scope.$watch('invalidAfter', function(value) {
        if (value) {
          input.max = formatDate(value);
        } else {
          input.removeAttribute('max');
        }
      });
    }

    return {
      restrict : 'A',
      link     : link,
      require  : 'ngModel',
      scope    : {
        ngModel       : '=',
        dateOptions   : '=?',
        invalidBefore : '=?',
        invalidAfter  : '=?',
        tooltips      : '=?'
      }
    };
  }]);
})(window.angular);
