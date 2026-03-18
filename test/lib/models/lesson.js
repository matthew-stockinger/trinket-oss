var _           = require('underscore'),
    sinon       = require('sinon'),
    should      = require('chai').should(),
    defaults    = require('../../helpers/defaults'),
    db          = require('../../helpers/db'),
    ownable     = require('../../../lib/models/plugins/ownable');

describe('Lesson model', function(){
  describe('plugins', function() {
    it('should implement the ownable plugin', function() {
      var plugin = _.find(Lesson.plugins, function(plugin) {
        return plugin === ownable;
      });
      should.exist(plugin);
    });
  });
});
