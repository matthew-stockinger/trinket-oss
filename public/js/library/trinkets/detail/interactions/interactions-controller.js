TrinketIO.export('library.trinkets.detail.interactions.controller', ['$scope', '$stateParams', 'Restangular', 'trinketUtil', function($scope, $stateParams, Restangular, trinketUtil) {
  $scope.interactions = undefined;

  $scope.interactionMap = {
    'embedViews'  : 'Viewed',
    'linkViews'   : 'Viewed',
    'emailViews'  : 'Viewed',
    'embedShares' : 'Shared',
    'linkShares'  : 'Shared',
    'emailShares' : 'Shared',
    'runs'        : 'Interacted with',
    'forks'       : 'Modification made'
  };

  var parser = document.createElement('a');

  Restangular.one('trinkets', $stateParams.shortCode).getList('interactions')
    .then(function(interactions) {
      $scope.interactions = [];
      angular.forEach(interactions.reverse(), function(interaction) {
        // get timestamp portion of mongo id
        interaction.interacted = parseInt(interaction.id.slice(0, 8), 16)*1000;
        if (interaction.referer) {
          parser.href = interaction.referer;
          interaction.referer_host = parser.hostname;
        }
        $scope.interactions.push(interaction);
      });
    });
}]);
