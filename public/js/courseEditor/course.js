(function(angular) {
  'use strict';

  /**
   * helper module to get and cache a course
   */

  angular.module('trinket.course', [])
    .factory('trinketCourse', ['$q', 'Restangular', function($q, Restangular) {
      var thisCourse;
      return {
        getCourse : function(courseId, options) {
          if (thisCourse) return $q.when(thisCourse);

          options = angular.extend({ outline : true }, options || {});

          return Restangular
            .one('courses', courseId)
            .get(options)
            .then(function(course) {
              course.lessons = Restangular.restangularizeCollection(course, course.lessons, 'lessons');

              angular.forEach(course.lessons, function(lesson) {
                lesson.materials = Restangular.restangularizeCollection(lesson, lesson.materials, 'materials');
              });

              thisCourse = course;
              return thisCourse;
            });
        }
      };
    }]);

})(window.angular);
