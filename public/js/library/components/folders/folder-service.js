(function(angular, module) {

function FolderService(Restangular) {
  this.getList = function(options) {
    return Restangular.all('folders').getList(options);
  }

  this.updateName = function(id, data) {
    return Restangular.all('folders').one(id).customPUT(data, 'name');
  }
}

module.service('foldersApi', ['Restangular', FolderService]);

})(window.angular, window.angular.module('trinket.components.folders'));
