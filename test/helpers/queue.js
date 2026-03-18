var sinon   = require('sinon'),
    snapshotQueue = require('../../lib/util/queues').snapshots();

module.exports = {
  snapshotQueue : snapshotQueue,
  stub : function() {
    before(function() {
      sinon.stub(snapshotQueue, 'add', function(data) {
        return {
          then : function(f) {
            f();
          }
        };
      });
    });

    after(function() {
      snapshotQueue.add.restore();
    });
  }
};
