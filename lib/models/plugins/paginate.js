var SORT_REGEXP = /^\s*(\-)?\s*(.*)\s*$/i;
var _           = require('underscore');

module.exports = function(schema, config) {
  var allowedSortKeys = {},
      defaultLimit    = typeof config.defaultLimit === 'number'
        ? config.defaultLimit
        : 10,
      maxLimit        = typeof config.maxLimit === 'number'
        ? config.maxLimit
        : Math.max(defaultLimit, 100),
      defaultFields = config.fields || {},
      defaultSortKey, sortKeyList;

  if (maxLimit < defaultLimit) {
    throw new Error('The default limit for the paginate plugin must not exceed the maximum limit');
  }

  if (typeof config.sortBy === 'string') {
    sortKeyList = [config.sortBy];
  }
  else if (!Array.isArray(config.sortBy) || config.sortBy.length === 0) {
    throw new Error('The paginate plugin requires an array of at least one allowed sort key');
  }
  else {
    sortKeyList = config.sortBy;
  }

  for (var i = 0; i < sortKeyList.length; i++) {
    allowedSortKeys[sortKeyList[i]] = true;
  }

  defaultSortKey = sortKeyList[0];

  schema.statics.paginate = function(queryOptions, cb) {
    var options = !queryOptions || typeof queryOptions === 'function'
          ? {}
          : queryOptions,
        where = typeof options.where === 'object'
          ? options.where
          : {},
        limit = !isNaN(parseInt(options.limit))
          ? parseInt(options.limit)
          : defaultLimit,
        offset = !isNaN(parseInt(options.offset))
          ? parseInt(options.offset)
          : 0,
        fields = _.extend(options.fields || {}, defaultFields),
        sortString = typeof options.sort === 'string'
          ? options.sort
          : defaultSortKey,
        sortBy, sortOrder, sortMatch, sort, queryCondition, query;

    cb = typeof queryOptions === 'function' ? queryOptions : cb;

    if (limit > maxLimit) {
      throw new Error('The limit must be less than the max limit of ' + maxLimit);
    }

    sortMatch = sortString.match(SORT_REGEXP);
    sortOrder = sortMatch[1] ? -1 : 1;
    sortBy    = sortMatch[2];

    if (!allowedSortKeys[sortBy]) {
      throw new Error('The sort key "' + sortBy + '" is not allowed by the paginate plugin');
    }

    sort           = {};
    sort[sortBy]   = sortOrder;
    queryCondition = sortOrder < 0 ? '$lt' : '$gt';

    if (options.from) {
      // turn $gt and $lt into $gte and $lte
      queryCondition += 'e';
    }

    where[sortBy] = {
      '$exists' : true
    };

    if (options.from || options.after) {
      where[sortBy][queryCondition] = options.from || options.after;
    }

    query = this.find(where).sort(sort).select(fields);

    if (offset) {
      query.skip(offset);
    }

    query.limit(limit);

    return (typeof cb === 'function')
      ? query.exec(cb)
      : query;
  }
};
