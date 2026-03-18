function UserStore(getClient) {
  var api = {
    key : function() {
      var args = Array.prototype.slice.call(arguments);
      return 'users:' + args.join(':');
    },
    userIdsKey : function(username) {
      return 'users:' + username + ':ids';
    },
    getIdByUsername : async function(username) {
      var client = await getClient();
      var key = api.userIdsKey(username);
      return await client.lIndex(key, 0);
    },
    linkIdToUsername : async function(username, id) {
      var client = await getClient();
      var key = api.userIdsKey(username);
      return await client.lPush(key, id);
    },
    unlinkIdFromUsername : async function(username, id) {
      var client = await getClient();
      var key = api.userIdsKey(username);
      return await client.lRem(key, 0, id);
    },
  };

  return api;
}

module.exports = UserStore;
