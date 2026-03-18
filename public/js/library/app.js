angular
  .module('trinket.library', [
    'trinket.config',
    'trinket.util',
    'ui.router',
    'restangular',
    'infinite-scroll',
    'ngAnimate',
    'xeditable',
    'trinket.components.foundation',
    'trinket.components.trinkets',
    'trinket.components.folders',
    'trinket.library.components.state',
    'trinket.lang',
    'trinket.roles',
    'trinket.search',
    'trinket.share',
    'ngTextSelect',
    'mm.foundation'
  ])
  .config(['$locationProvider', '$stateProvider', 'RestangularProvider', function($locationProvider, $stateProvider, RestangularProvider) {
    $locationProvider.hashPrefix('!');
    $locationProvider.html5Mode(true);

    RestangularProvider.setBaseUrl('/api');
    RestangularProvider.addResponseInterceptor(function(response) {
      return response.data ? response.data : response;
    });
    RestangularProvider.setDefaultHeaders({'Content-Type': 'application/json'});

    RestangularProvider.addElementTransformer('trinkets', false, function(trinket) {
      if (trinket.id) {
        // allow admin to force a new snapshot
        trinket.addRestangularMethod('takeSnapshot', 'post', 'snapshot');

        // custom method to add this trinket to a folder
        trinket.addRestangularMethod('addToFolder',  'post', 'folder');

        // custom method to remove this trinket from a folder
        trinket.addRestangularMethod('removeFromFolder',  'remove', 'folder');
      }

      return trinket;
    });

    $stateProvider
      .state('list', {
        url : '/trinkets?user',
        templateUrl : trinketConfig.prefix('/js/library/trinkets/list/list.html'),
        controller : TrinketIO.import('library.trinkets.list.controller')
      })
      .state('folderList', {
        url : '/folder/:slug?user',
        templateUrl : trinketConfig.prefix('/js/library/trinkets/list/folder.html'),
        controller : TrinketIO.import('library.trinkets.list.folderController')
      })
      .state('create', {
        url : '/trinkets/create?lang',
        templateUrl : trinketConfig.prefix('/js/library/trinkets/create/create.html'),
        controller  : TrinketIO.import('library.trinkets.create.controller'),
        resolve : {
          examples : ['$http', '$stateParams', function($http, $stateParams) {
            return $http({
              method : 'GET',
              url    : '/api/trinkets/' + $stateParams.lang + '/list?name=examples'
            });
          }]
        }
      })
      .state('copy', {
        url : '/trinkets/copy/:shortCode',
        templateUrl : trinketConfig.prefix('/js/library/trinkets/copy/copy.html'),
        controller  : TrinketIO.import('library.trinkets.copy.controller'),
        resolve : {
          source : ['libraryState', 'trinketsApi', '$stateParams', function(libraryState, trinketsApi, $stateParams) {
            if (libraryState.lastTrinket && libraryState.lastTrinket.shortCode === $stateParams.shortCode) {
              return libraryState.lastTrinket;
            }
            else {
              return trinketsApi.getOne($stateParams.shortCode)
                .then(function(trinket) {
                  libraryState.lastTrinket = trinket;
                  return trinket;
                });
            }
          }]
        }
      })
      .state('detail', {
        url : '/trinkets/:shortCode?go&_3d',
        templateUrl : trinketConfig.prefix('/js/library/trinkets/detail/detail.html'),
        controller : TrinketIO.import('library.trinkets.detail.controller')
      })
      .state('detail.description', {
        views : {
          'description' : {
            templateUrl : trinketConfig.prefix('/js/library/trinkets/detail/description.html')
          }
        }
      })
      .state('detail.embed', {
        views : {
          'embed' : {
            templateUrl : trinketConfig.prefix('/js/library/trinkets/detail/embed.html')
          }
        }
      })
      .state('detail.interactions', {
        views : {
          'interactions' : {
            templateUrl : trinketConfig.prefix('/js/library/trinkets/detail/interactions/interactions.html'),
            controller : TrinketIO.import('library.trinkets.detail.interactions.controller')
          }
        }
      })
      .state('detail.share', {
        views : {
          'share' : {
            templateUrl : trinketConfig.prefix('/js/library/trinkets/detail/share.html'),
            resolve : {
              lang : ['trinketsApi', '$stateParams', function(trinketsApi, $stateParams) {
                return trinketsApi.getOne($stateParams.shortCode)
                  .then(function(trinket) {
                    return trinket.lang;
                  });
              }]
            },
            controller : function($scope, lang) {
              lang = lang || 'python';
            }
          }
        }
      });
  }])
  .run(['$rootScope', 'editableOptions', function($rootScope, editableOptions) {
    editableOptions.buttons = 'default';
    $rootScope.$on('$viewContentLoaded', function () {
      $(document).foundation();
    });
  }]);
