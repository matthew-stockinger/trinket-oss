module.exports = {
  // string interpolation:
  // e.g. interpolate('my name is {name}', {name:'ben'})
  interpolate : function(string, values) {
    return string.replace(
      /{([^{}]*)}/g,
      function (a, b) {
        var r    = values;
        var path = b.split('.');
        while(path.length && r !== undefined && r !== null) {
          r = r[path.shift()];
        }

        if (r !== undefined && r !== null && r.toString) {
          r = r.toString();
        }

        return typeof r === 'string' || typeof r === 'number' ? r : a;
      }
    );
  },

  addPrefix : function(string, prefixes, key) {
    if (!/^\/\//.test(string)) {
      var path = string.split('/');
      key = key || path[1];
      if (prefixes[ key ]) {
        string = '/' + prefixes[ key ] + string;
      }
      else {
        string = '/cache-prefix-' + Date.now() + string;
      }
    }

    return string;
  }
};
