var sinon    = require('sinon'),
    should   = require('chai').should(),
    flow     = require('../../helpers/flow'),
    defaults = require('../../helpers/defaults');

module.exports = function() {
  describe('User Logout', function() {
    describe('When I log out', function() {
      before(function(done) {
        flow.switchUser('user');
        flow.logout(function() {
          done();
        });
      });

      it('should redirect me to the splash page', function() {
        flow.wasOk.should.be.true;
        flow.lastResponse.statusCode.should.eql(302);
        flow.lastResponse.redirect.should.be.true;
        flow.lastRedirect.pathname.should.eql('/');
      });

      it('should not allow me to go to the home page', function(done) {
        flow.home(function() {
          flow.wasOk.should.be.true;
          flow.lastResponse.statusCode.should.eql(302);
          flow.lastRedirect.pathname.should.eql('/login');
          done();
        });
      })
    });
  });
};
