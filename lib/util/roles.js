var crypto   = require('crypto')
  , CryptoJS = require('node-cryptojs-aes').CryptoJS;

module.exports = {
  encrypt : function(obj) {
    if (typeof obj === 'object') {
      obj = JSON.stringify(obj);
    }

    var token     = crypto.randomBytes(16).toString('hex');
    var encrypted = CryptoJS.AES.encrypt(obj, token).toString();

    return token + '+' + encrypted;
  }
}
