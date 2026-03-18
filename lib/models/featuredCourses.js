var model = require('./model');

var schema = {
  // Single document identifier
  key: { type: String, default: 'featured', unique: true },
  // Array of featured course references
  courses: [{
    courseId: { type: String, required: true },
    page: { type: String, default: '' }
  }]
};

function getList(cb) {
  return this.model.findOne({ key: 'featured' })
    .then(function(doc) {
      var courses = doc ? doc.courses : [];
      if (cb) cb(null, courses);
      return courses;
    })
    .catch(function(err) {
      if (cb) cb(err);
      throw err;
    });
}

function addCourse(courseId, page, cb) {
  var self = this;
  return this.model.findOne({ key: 'featured' })
    .then(function(doc) {
      if (!doc) {
        doc = new self.model({ key: 'featured', courses: [] });
      }
      // Check for duplicates
      var exists = doc.courses.some(function(c) {
        return c.courseId === courseId && c.page === (page || '');
      });
      if (!exists) {
        doc.courses.push({ courseId: courseId, page: page || '' });
      }
      return doc.save();
    })
    .then(function(doc) {
      if (cb) cb(null, doc.courses);
      return doc.courses;
    })
    .catch(function(err) {
      if (cb) cb(err);
      throw err;
    });
}

function removeCourse(courseId, page, cb) {
  return this.model.findOne({ key: 'featured' })
    .then(function(doc) {
      if (!doc) {
        if (cb) cb(null, []);
        return [];
      }
      doc.courses = doc.courses.filter(function(c) {
        return !(c.courseId === courseId && c.page === (page || ''));
      });
      return doc.save();
    })
    .then(function(doc) {
      if (cb) cb(null, doc.courses);
      return doc.courses;
    })
    .catch(function(err) {
      if (cb) cb(err);
      throw err;
    });
}

function moveCourse(courseId, page, currentIndex, newIndex, cb) {
  return this.model.findOne({ key: 'featured' })
    .then(function(doc) {
      if (!doc || !doc.courses.length) {
        if (cb) cb(null, []);
        return [];
      }
      // Move the item
      var item = doc.courses.splice(currentIndex, 1)[0];
      doc.courses.splice(newIndex, 0, item);
      return doc.save();
    })
    .then(function(doc) {
      if (cb) cb(null, doc.courses);
      return doc.courses;
    })
    .catch(function(err) {
      if (cb) cb(err);
      throw err;
    });
}

var FeaturedCourses = model.create('FeaturedCourses', {
  schema: schema,
  classMethods: {
    getList: getList,
    addCourse: addCourse,
    removeCourse: removeCourse,
    moveCourse: moveCourse
  }
});

module.exports = FeaturedCourses.publicModel;
