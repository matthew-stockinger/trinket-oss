module.exports = function(schema, options) {
  schema.methods.isChanged = function(field) {
    return this._modifiedPaths.indexOf(field) >= 0 ? true : false;
  }

  schema.pre('save', function(next) {
    this._modifiedPaths = this.modifiedPaths();
    next();
  });
}
