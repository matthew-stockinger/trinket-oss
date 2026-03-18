var sinon    = require('sinon'),
    should   = require('chai').should(),
    flow     = require('../../helpers/flow'),
    defaults = require('../../helpers/defaults');

module.exports = function() {
  describe('Admin Access', function() {
    var user, admin;

    before(function(done) {
      admin = new User(defaults.admin);
      admin.save(done);
    });

    before(function(done) {
      user = new User(defaults.extend({ email: 'not@admin.com', username: 'notadmin' }, 'user'));
      user.save(done);
    });

    after(function(done) {
      user.remove(done);
    });

    describe('When I am not logged in', function() {
      // switch to a null user
      before(function() {
        flow.switchUser('');
      });

      describe('and I access /admin', function() {
        it('should redirect me to /login', function(done) {
          flow.admin(function(err, response) {
            flow.wasOk.should.be.true;
            flow.lastResponse.statusCode.should.eql(302);
            flow.lastResponse.redirect.should.be.true;
            flow.lastRedirect.pathname.should.eql('/login');
            done();
          });
        });
      });
    });

    describe('When I am logged in as a non-admin', function() {
      before(function(done) {
        flow.switchUser('user', done);
      });

      describe('and I access /admin', function() {
        it('should not allow access to admin page', function(done) {
          flow.admin(function(err, response) {
            flow.wasOk.should.be.true;
            flow.lastResponse.statusCode.should.eql(403);
            flow.lastResponse.redirect.should.be.false;
            done();
          });
        });
      });
    });

    describe('When I am logged in as an admin', function() {
      before(function(done) {
        flow.switchUser('admin');
        done();
      });

      describe('and I access /admin', function() {
        it('should allow access to admin page', function(done) {
          flow.login({ email: defaults.admin.email, password: defaults.admin.password }, function(err, response) {
            flow.admin(function(err, response) {
              flow.wasOk.should.be.true;
              flow.lastResponse.statusCode.should.eql(200);
              done();
            });
          });
        });
      });
    });
  });
};
