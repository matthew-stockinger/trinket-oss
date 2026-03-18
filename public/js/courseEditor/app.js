angular
  .module('courseEditor', [
    'trinket.config',
    'trinket.markdown',
    'trinket.util',
    'trinket.lang',
    'trinket.course',
    'ngRoute',
    'xeditable',
    'ngAnimate',
    'ngFileUpload',
    'ui.scrollfix',
    'trinket.roles',
    'trinket.search',
    'trinket.assignment',
    'trinket.feedback',
    'assignment.dashboard',
    'ui.tree',
    'restangular',
    'focusMe',
    'mm.foundation',
    'ngFileSaver',
    'notifyjs',
    'angularMoment',
    'trinket.calendar'
  ])
  .config(['$routeProvider', 'RestangularProvider', '$animateProvider', function($routeProvider, RestangularProvider, $animateProvider) {
    RestangularProvider.setBaseUrl('/api');
    RestangularProvider.addResponseInterceptor(function(response) {
      var status = response.status;
      if (status === 'error' || status === 'fail') return response;
      return response.data ? response.data : response;
    });
    RestangularProvider.setDefaultHeaders({'Content-Type': 'application/json'});

    $routeProvider
      .when(
        '/',
        { templateUrl: '/partials/course_editor.html',  controller: 'rootControl' }
      )
      .when(
        '/_dashboard',
        { templateUrl: '/partials/course_dashboard.html', controller: 'dashboardControl' }
      )
      .when(
        '/_dashboard/:lessonSlug/:materialSlug',
        { templateUrl: '/partials/material_dashboard.html', controller: 'dashboardControl' }
      )
      .when(
        '/_dashboard/:username',
        { templateUrl: '/partials/student_dashboard.html', controller: 'dashboardControl' }
      )
      .when(
        '/:lessonSlug/:materialSlug',
        { templateUrl: '/partials/course_editor.html',  controller: 'rootControl' }
      )
      .when(
        '/:lessonSlug/:materialSlug/edit',
        { templateUrl: '/partials/material.html', controller: 'materialControl' }
      )
      .otherwise({redirectTo: '/'});

      // only animate elements with the ng-animate-enabled class
      $animateProvider.classNameFilter(/ng-animate-enabled/);
  }])
  .run(function($rootScope, editableOptions, editableThemes) {
    editableOptions.theme = 'default';
    editableOptions.buttons = 'no';
    editableThemes['default'].cancelTpl = '<button class="alert cancel" type="button" ng-click="$form.$cancel()"><i class="fa fa-times"></i></button>';
    editableThemes['default'].submitTpl = '<button class="success" type="submit"><i class="fa fa-check"></i></button>';
    editableThemes['default'].errorTpl = '<div class="editable-error alert-box warning" ng-show="$error" ng-bind="$error" data-alert></div>';

    $rootScope.focusMe = false;
    $rootScope.$on('$viewContentLoaded', function () {
      $(document).foundation();
      $(document).on('close.fndtn.reveal', '[data-reveal]', function() {
        var modal = $(this);
        if (modal[0].id === "newPageDialog") {
          $rootScope.focusMe = false;
          $rootScope.$apply();
        }
      });
    });
  });
