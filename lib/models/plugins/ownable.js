var _        = require('underscore'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.SchemaTypes.ObjectId;

module.exports = function(schema, options) {
  options = _.extend({
    index:    true,
    required: true
  }, options || {});

  schema.add({
    _owner:   { type: ObjectId, ref: 'User', required: options.required, index: options.index },
    _creator: { type: ObjectId, ref: 'User' }
  });

  schema.methods.setOwner = function(owner) {
    this._owner = owner;
    // default the creator to the owner
    if (!this._creator) {
      this._creator = owner;
    }
  }

  schema.pre('save', function(next) {
    if (!this._creator) {
      this._creator = this._owner;
    }
    next();
  });
};
