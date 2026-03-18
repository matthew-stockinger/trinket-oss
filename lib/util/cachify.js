var config = require('config');

var js = function(key, srcList) {
  var scripts = [];

  if (config.app.minified && config.app.minified[key]) {
    scripts.push('<script src="' + config.aws.buckets.cdn.host + '/' + config.app.minified[key] + '" type="text/javascript"></script>');
  }
  else {
    srcList.forEach(function(src) {
      scripts.push('<script src="' + src + '" type="text/javascript"></script>');
    });
  }

  return scripts.join('\n');
}

module.exports = {
  js : js
};
