(function(angular) {
  'use strict';

  /**
   * service for getting and posting submissions and feedback
   */

  angular.module('trinket.submissions', [
    'restangular'
  ]).config(['RestangularProvider', function(RestangularProvider) {
    RestangularProvider.setBaseUrl('/api');
    RestangularProvider.addResponseInterceptor(function(response) {
      return response.data ? response.data : response;
    });
    RestangularProvider.setDefaultHeaders({'Content-Type': 'application/json'});
  }]).factory('trinketSubmissions', ['Restangular', function(Restangular) {
    var service = {};

    /**
     * sets up and starts a new "assignment"
     */
    service.startAssignment = function(material) {
      return material.customPOST({
        parent : material.trinket.trinketId
      }, "startAssignment");
    }

    /**
     * submits code for an "assignment"
     */
    service.submitAssignment = function(material, code, comments) {
      return material.customPOST({
          parent   : material.trinket.trinketId
        , code     : code
        , comments : comments
      }, "submissions");
    }

    /**
     * updates submission in case where submission is not complete
     */
    service.updateSubmission = function(submission, code, comments) {
      var submissionElement = Restangular.restangularizeElement(null, { id : submission.id }, "submissions");
      return submissionElement.customPOST({
          code     : code
        , comments : comments
      });
    }

    /**
     * get all submissions for the current user for this material
     */
    service.getSubmissionsForMaterial = function(material) {
      var submissionElement = Restangular.restangularizeElement(null, { id : material.id }, "submissions");
      return submissionElement.getList();
    }

    /**
     * get all submissions for this user and this material
     */
    service.getUserSubmissionsForMaterial = function(user, material) {
      var course = material.parentResource.parentResource;
      // /api/courses/{courseId}/users/{userId}/materials/{materialId}/submissions
      return Restangular.one("courses", course.id)
                        .one("users", user.userId)
                        .one("materials", material.id)
                        .all("submissions")
                        .getList();
    }

    /**
     *
     */
    service.sendFeedback = function(material, trinketId, code, feedback) {
      return material.customPOST({
          code            : code
        , trinketId       : trinketId
        , comments        : feedback.comments
        , includeRevision : feedback.includeRevision
        , allowResubmit   : feedback.allowResubmit
      }, "feedback");
    }

    /**
     *
     */
    service.autosaveStudentComments = function(submission) {
      var submissionElement = Restangular.restangularizeElement(null, { id : submission.id }, "comments");
      return submissionElement.customPOST({
        comments : submission.comments
      });
    }

    /**
     *
     */
    service.autosaveFeedbackComments = function(submissionId, comments) {
      var submissionElement = Restangular.restangularizeElement(null, { id : submissionId }, "feedback-comments");
      return submissionElement.customPOST({
        comments : comments
      });
    }

    /**
     *
     */
    service.autosaveSubmissionOpt = function(submissionId, submissionOptKey, submissionOptVal) {
      var submissionElement = Restangular.restangularizeElement(null, { id : submissionId }, "submission-opt")
        , postData = {};

      postData[submissionOptKey] = submissionOptVal;
      return submissionElement.customPOST(postData);
    }

    /**
     * updates a pending submission to submitted
     */
    service.acceptSubmission = function(material, trinketId) {
      return material.customPOST({
        trinketId : trinketId
      }, "acceptSubmission");
    }

    return service;
  }]);
})(window.angular);
