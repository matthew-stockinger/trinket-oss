System.register([], function (_export, _context) {
   "use strict";

   var EventTargetMixin;
   return {
      setters: [],
      execute: function () {
         EventTargetMixin = {
            _listeners: null,

            addEventListener: function (type, callback) {
               if (!this._listeners) {
                  this._listeners = new Map();
               }
               if (!this._listeners.has(type)) {
                  this._listeners.set(type, new Set());
               }
               this._listeners.get(type).add(callback);
            },

            removeEventListener: function (type, callback) {
               if (!this._listeners || !this._listeners.has(type)) {
                  return;
               }
               this._listeners.get(type).delete(callback);
            },

            dispatchEvent: function (event) {
               if (!this._listeners || !this._listeners.has(event.type)) {
                  return true;
               }
               this._listeners.get(event.type).forEach(function (callback) {
                  callback.call(this, event);
               }, this);
               return !event.defaultPrevented;
            }
         };

         _export("default", EventTargetMixin);
      }
   };
});