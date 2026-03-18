var defaults = {
  created:     "created",
  lastUpdated: "lastUpdated"
};

function dateJSON(key) {
  var json = {};
  json[key] = { type: Date, default: Date.now };
  return json;
};

module.exports = function(schema, options) {
  var created     = options && options.created     ? options.created     : defaults.created,
      lastUpdated = options && options.lastUpdated ? options.lastUpdated : defaults.lastUpdated;

  schema.add(dateJSON(created));
  schema.add(dateJSON(lastUpdated));

  return schema.pre("save", function(next) {
    if (!this.isModified()) return next();

    var timestamp = Date.now();

    if (this[created] == null) {
      this[created] = timestamp;
    }
    
    this[lastUpdated] = timestamp;
    return next();
  });
};