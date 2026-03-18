(function(angular, module) {

module.factory('libraryState', function () {
    return {
      trinkets : undefined, // list
      listParams : {
        sort   : '-lastUpdated',
        from   : undefined,
        offset : 0
      },
      scrollPos : 0,
      folders : undefined, // list
      trinketsByFolder : undefined, // object by folder id
      defaultFolderListParams : {
        sort      : '-lastUpdated',
        from      : undefined,
        offset    : 0,
        scrollPos : 0
      },
      folderListParams : undefined,
      userParam : undefined,
      resetList : function() {
        this.scrollPos         = 0;
        this.folders           = undefined;
        this.trinkets          = undefined;
        this.trinketsByFolder  = undefined;
        this.folderListParams  = undefined;
        this.listParams.from   = undefined;
        this.listParams.offset = 0;
        this.userParam         = undefined;
      },
      lastTrinket : undefined
    };
});

})(window.angular, window.angular.module('trinket.library.components.state'));
