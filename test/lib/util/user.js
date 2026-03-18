var sinon = require('sinon')
  , should = require('chai').should()
  , userUtil = require('../../../lib/util/user');

describe('User Utilities', function() {
  describe('Generating Usernames', function() {
    describe('generate username from an email address', function() {
      it('should replace certain characters and ensure lowercase', function(done) {
        var username = userUtil.generate_username('testuser@Dummy.com');

        username.should.not.include('@');
        username.should.not.include('.');
        username.should.not.match(/[A-Z]/);

        done();
      });
    });

    describe('generate username from a fullname', function() {
      it('should replace certain characters, not include spaces, and ensure lowercase', function(done) {
        var username = userUtil.generate_username('Test X. User');

        username.should.not.include('@');
        username.should.not.include('.');
        username.should.not.match(/[A-Z\s]/);

        done();
      });
    });

    describe('generate username with a suffix', function() {
      it('should include a suffix', function(done) {
        var username = userUtil.generate_username_with_suffix('testuser');

        username.should.match(/\d{4}$/);

        done();
      });
    });
  });
});
