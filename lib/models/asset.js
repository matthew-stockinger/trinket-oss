var Schema      = require('mongoose').Schema
  , ObjectId    = require('mongoose').SchemaTypes.ObjectId
  , AssetSchema = new Schema({
        id        : { type: ObjectId, ref : 'File', index: true}
      , url       : { type : String }
      , thumbnail : { type : String }
      , name      : { type : String }
    }, {_id:false});

AssetSchema.methods['serialize'] = function() {
  return {
      id        : this.id.toString()
    , name      : this.name
    , url       : this.url
    , thumbnail : this.thumbnail
  };
}

module.exports = AssetSchema;
