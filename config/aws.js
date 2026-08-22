var AWS      = require('aws-sdk')
    , config = require('config');

AWS.config.update({
  accessKeyId       : config.aws.keyId
  , secretAccessKey : config.aws.key
  , region          : config.aws.region
});

// When `aws.endpoint` is set we are talking to an S3-compatible provider
// (Google Cloud Storage, MinIO, Wasabi...) rather than Amazon. Those need the
// bucket in the URL path instead of the hostname, and v4 request signing.
var s3Defaults = {};
if (config.aws.endpoint) {
  s3Defaults.endpoint         = config.aws.endpoint;
  s3Defaults.s3ForcePathStyle = true;
  s3Defaults.signatureVersion = 'v4';
}

// Shadow AWS.S3 so every `new aws.S3()` in the app picks the defaults up,
// without mutating the aws-sdk module other requires share.
var exported = Object.create(AWS);
exported.S3  = function(options) {
  return new AWS.S3(Object.assign({}, s3Defaults, options));
};

module.exports = exported;
