var _        = require('underscore'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.SchemaTypes.ObjectId,
    sluggify = require('limax'),
    tr       = require('transliteration').slugify;

module.exports = function(schema, options) {
  options = _.extend({
    path:  'name',
    index: true
  }, options || {});

  var path = options.path;

  schema.add({ slug: { type: String }, index: options.index });
  schema.pre('save', function(next) {
    if (this.isModified(path)) {
      this.slug = sluggify(this[path]);
      if (this.slug.length === 0) {
        try {
          this.slug = tr(this[path]);
        } catch(e) {
          console.log("transliteration slugify err:", e, this[path]);
        }

        // if still no slug, make it something random
        if (this.slug.length === 0) {
          this.slug = Math.random().toString(36).slice(-8);
        }
      }
    }

    return next();
  });
};
