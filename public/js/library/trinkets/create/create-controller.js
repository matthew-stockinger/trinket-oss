TrinketIO.export('library.trinkets.create.controller',

['$scope', '$state', '$stateParams', 'libraryState', '$window', '$timeout', '$http', 'examples', 'trinketRoles', 'trinketConfig',
function($scope, $state, $stateParams, libraryState, $window, $timeout, $http, examples, roles, config) {
  $($window).scrollTop(0);

  $scope.config = config;
  $scope.canCreate = false;
  $scope.examples = examples.data && examples.data.length ? examples.data : null;
  $scope.trinket = {
    name : ''
  };

  $scope.trinketApi = null;

  var persist = function() {
    libraryState.resetList();

    var data = $scope.trinketApi.serialize();
    for (var key in data) {
      $scope.trinket[key] = data[key];
    }

    $scope.trinketApi.create($scope.trinket, { library : true }, function(trinket) {
      libraryState.lastTrinket = trinket;
      $scope.trinketApi.destroy();
      $state.go('detail', { shortCode : trinket.shortCode });
    });
  }

  $scope.cancel = function() {
    if ($scope.trinketApi) {
      $scope.trinketApi.destroy();
    }
    $state.go('list');
  }

  $scope.save = function() {
    // delay the save to allow scope to fully update
    // in case the user had focus in the name field
    $timeout(persist);
  }

  $scope.lang        = $stateParams.lang;
  $scope.iframeQuery = 'noStorage=true&inLibrary=true&addDefaultCode=true';

  var permission = ['create', $scope.lang, 'trinket'].join('-');
  if (roles.hasPermission(permission)) {
    $scope.canCreate = true;

    // only disable sharing if user can create this type of trinket
    // e.g. if trinket is python3 but user is not subscribed to
    // trinket connect, let them share
    $scope.iframeQuery = 'noSharing=true&' + $scope.iframeQuery;
  }

  $scope.setIframeUrl = function(lang) {
    // if glowscript, check for glowscript-blocks permission and that it's enabled
    // Only show the interstitial if both glowscript types are available
    var blocksEnabled = config.get('trinketTypes').some(function(t) { return t.lang === 'glowscript-blocks'; });
    if (!lang && $scope.lang === 'glowscript' && blocksEnabled && roles.hasPermission('create-glowscript-blocks-trinket')) {
      return;
    }

    if ($scope.lang && lang && $scope.lang !== lang) {
      $scope.examples = null;

      $http({
          method : 'GET'
        , url    : '/api/trinkets/' + lang + '/list?name=examples'
      })
      .then(function(response) {
        if (response.status === 200 && response.data && response.data.length) {
          $scope.examples = response.data;
        }
      });
    }

    if (lang) {
      $scope.lang = lang;
    }

    $scope.iframeUrl = '/embed/' + $scope.lang + '?' + $scope.iframeQuery;
  }

  $scope.setIframeUrl();

  $scope.$watch('trinketApi', function(newValue, oldValue) {
    if (newValue) {
      $scope.trinketApi.focus();
    }
  });
}]

);
