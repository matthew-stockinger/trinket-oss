var fileUtil     = require('../../util/file'),
    Trinket      = require('../../models/trinket'),
    config       = require('config'),
    util         = require('util');

var fileUtil_removeFile = util.promisify(fileUtil.removeFile);

// these functions written and exposed for testing
function isSnapshotUsed(snapshot) {
  var TrinketModel = require('mongoose').model('Snippet');
  return TrinketModel.countDocuments({ snapshot : snapshot })
    .then(function(count) {
      return !!count;
    });
}

function removeFile(container, file) {
  if (!file) return Promise.resolve();
  return internals.isSnapshotUsed(file)
    .then(function(isUsed) {
      if (!isUsed) {
        return fileUtil_removeFile(container, file);
      }
    });
}

var internals = {
  removeFile        : removeFile,
  isSnapshotUsed    : isSnapshotUsed
};

module.exports.removeSnapshot = function(snapshot) {
  return internals.removeFile('snapshots', snapshot);
}

if (config.isTest) {
  module.exports.internals = internals;
}
