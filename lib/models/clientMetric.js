var model    = require('./model'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.SchemaTypes.ObjectId,
    schema   = {
      timestamp_minute : { type : Date, required : true, unique : true },
      values : [{
        _id        : false,
        event_type : { type : String },
        lang       : { type : String },
        duration   : { type : Number },
        user       : { type : ObjectId, ref : 'User' },
        trinket    : { type : ObjectId, ref : 'Snippet' },
        message    : { type : String },
        address    : { type : String },
        referer    : { type : String },
        user_agent : { type : String },
        session    : { type : String }
      }]
    };

function addMetric(values) {
  var coeff = 60000
    , current_timestamp
    , query, update, updateOptions;

  // find by timestamp_minute and update
  current_timestamp = new Date(Math.round( (new Date()).getTime() / coeff) * coeff);

  query = {
    timestamp_minute : current_timestamp
  };

  update = {
    $push : {
      values : values
    }
  };

  updateOptions = {
      new    : true
    , upsert : true
  };

  return ClientMetric.privateModel.updateOne(query, update, updateOptions).exec();
}

var ClientMetric = model.create('ClientMetric', {
  schema       : schema,
  timestamps   : false,
  classMethods : {
    addMetric : addMetric
  }
});

module.exports = ClientMetric.publicModel;
