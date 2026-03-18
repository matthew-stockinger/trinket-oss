(function(angular) {
  angular.module('trinket.markdown', ['trinket.config'])
    .factory('markdownParser', ['trinketConfig', function(trinketConfig) {
      return function(options) {
        options = angular.extend({}, options);

        return trinketMarkdown(options);
      }
    }]);
})(window.angular);
