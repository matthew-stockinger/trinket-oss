function TrinketStore(getClient) {
  var api = {
    key : function() {
      var args = Array.prototype.slice.call(arguments);
      return 'snippets:' + args.join(':');
    },
    random : async function(language, category) {
      var client = await getClient();
      var key = api.key(language, category);
      var values = await client.lRange(key, 0, -1);
      if (!values || values.length === 0) return null;
      var index = Math.floor(Math.random() * values.length);
      var trinketId = values[index];
      if (!trinketId) return null;
      var Trinket = require('../../models/trinket');
      return await Trinket.findById(trinketId);
    },
    add : async function(language, category, trinketId) {
      var client = await getClient();
      var key = api.key(language, category);
      return await client.rPush(key, trinketId);
    },
    unshift : async function(language, category, trinketId) {
      try {
        var client = await getClient();
        var key = api.key(language, category);
        return await client.lPush(key, trinketId);
      } catch (err) {
        console.log('trinket store unshift err:', err);
      }
    },
    byCategory : async function(language, category, num) {
      var key = api.key(language, category);
      if (typeof(num) === 'undefined') num = 2;
      try {
        var client = await getClient();
        var exists = await client.exists(key);
        if (exists) {
          return await client.lRange(key, 0, num);
        }
        return null;
      } catch (err) {
        console.log('trinket store ' + key + ' err:', err);
        return null;
      }
    },
    remove : async function(language, category, trinketId) {
      var client = await getClient();
      var key = api.key(language, category);
      return await client.lRem(key, 0, trinketId);
    },
    slugUserKey : function(slug, userId) {
      return ['snippets', slug, userId, 'ids'].join(':');
    },
    getIdBySlugAndUser : async function(slug, userId) {
      var client = await getClient();
      var key = api.slugUserKey(slug, userId);
      return await client.lIndex(key, 0);
    },
    linkIdToSlugAndUser : async function(slug, userId, id) {
      var client = await getClient();
      var key = api.slugUserKey(slug, userId);
      return await client.lPush(key, id);
    },
    unlinkIdFromSlugAndUser : async function(slug, userId, id) {
      var client = await getClient();
      var key = api.slugUserKey(slug, userId);
      return await client.lRem(key, 0, id);
    }
  };

  return api;
}

module.exports = TrinketStore;
