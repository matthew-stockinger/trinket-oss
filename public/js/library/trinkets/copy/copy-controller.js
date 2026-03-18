TrinketIO.export('library.trinkets.copy.controller',

['$scope', '$state', '$stateParams', 'libraryState', '$window', '$timeout', 'trinketRoles',
function($scope, $state, $stateParams, libraryState, $window, $timeout, roles) {
  var source = libraryState.lastTrinket;

  if (!source) {
    // load trinket by shortCode if libraryState.lastTrinket isn't defined?
    return $state.go('create', { lang : 'python' });
  }

  // will be set by embed directive
  $scope.trinketApi = null;

  $scope.name      = source.name;
  $scope.lang      = source.lang;
  $scope.shortCode = source.shortCode;
  $scope.canSave   = false;
  $scope.runMode   = "";

  $scope.iframeUrl = '/embed/' + source.lang + '?noSharing=true&noStorage=true&externalInit=true&inLibrary=true';

  if ($scope.name && $scope.name.length) {
    // Make sure generated name can't exeed 50 characters. Align this with e-maxlength values in create.html, detail.html, copy.html
    $scope.name = 'Copy of ' + source.name.substring(0, Math.min(source.name.length, 42));
  }

  var permission = ['create', source.lang, 'trinket'].join('-');
  if (roles.hasPermission(permission)) {
    $scope.canSave = true;
  }

  var persist = function() {
    libraryState.resetList();

    var data         = $scope.trinketApi.serialize();
    data.name        = $scope.name;
    data.description = source.description;

    $scope.trinketApi.fork(source, data, { library : true }, function(trinket) {
      libraryState.lastTrinket = trinket;
      $scope.trinketApi.destroy();
      $state.go('detail', { shortCode : trinket.shortCode }, { location : 'replace' });
    });
  };

  $scope.cancel = function() {
    $scope.trinketApi.destroy();
    $state.go('detail', {shortCode:$scope.shortCode});
  }

  $scope.save = function() {
    // delay the actual save to allow the current digest to complete
    // since the user may have had focus in the name field
    $timeout(persist);
  };

  $scope.$watch('trinketApi', function(newValue, oldValue) {
    if (newValue) {
      newValue.initialize(source);
    }
  });
}]

);
