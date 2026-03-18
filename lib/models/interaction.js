var model    = require('./model'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.SchemaTypes.ObjectId,
    schema   = {
      _trinket : { type: ObjectId, ref: 'Snippet', index: true },
      _owner   : { type: ObjectId, ref: 'User', index: true },
      lang     : { type: String },
      action   : { type: String },
      _actor   : { type: ObjectId, ref: 'User' },
      referer  : { type: String },
      address  : { type: String },
      info     : {} // arbitrary data flavored by action
    };

function findByTrinketId(trinketId) {
  var query = {_trinket:trinketId};
  return this.model.find(query).exec();
}

var Interaction = model.create('Interaction', {
  schema       : schema,
  timestamps   : false,
  classMethods : {
    findByTrinketId : findByTrinketId
  },
  publicSpec : {
    id       : 1,
    _trinket : 1,
    _owner   : 1,
    lang     : 1,
    action   : 1,
    _actor   : 1,
    referer  : 1,
    address  : 1,
    info     : 1
  }
}).publicModel;

module.exports = Interaction;
