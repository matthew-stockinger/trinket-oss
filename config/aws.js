var AWS      = require('aws-sdk')
    , config = require('config');

AWS.config.update({
  accessKeyId       : config.aws.keyId
  , secretAccessKey : config.aws.key
  , region          : config.aws.region
});

module.exports = AWS;
