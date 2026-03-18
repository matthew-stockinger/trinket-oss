function CourseStore(getClient) {
  var api = {
    key : function(slug) {
      return 'courses:' + slug + ':ids';
    },
    getIdBySlug : async function(slug) {
      var client = await getClient();
      var key = api.key(slug);
      return await client.lIndex(key, 0);
    },
    linkIdToSlug : async function(slug, id) {
      var client = await getClient();
      var key = api.key(slug);
      return await client.lPush(key, id);
    },
    unlinkIdFromSlug : async function(slug, id) {
      var client = await getClient();
      var key = api.key(slug);
      return await client.lRem(key, 0, id);
    }
  };

  return api;
}

module.exports = CourseStore;