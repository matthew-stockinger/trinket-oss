// Featured courses store - uses MongoDB instead of Redis
var FeaturedCourses = require('../../models/featuredCourses');

function FeaturedStore() {
  var api = {
    getList: async function() {
      var courses = await FeaturedCourses.getList();
      // Convert to the format expected by consumers: [{id, page}]
      return courses.map(function(c) {
        return { id: c.courseId, page: c.page || '' };
      });
    },
    addMember: async function(memberId, page) {
      await FeaturedCourses.addCourse(memberId, page);
    },
    removeMember: async function(memberId, page) {
      await FeaturedCourses.removeCourse(memberId, page);
    },
    moveMember: async function(memberId, page, currentIndex, newIndex) {
      await FeaturedCourses.moveCourse(memberId, page, currentIndex, newIndex);
    }
  };

  return api;
}

module.exports = FeaturedStore;
