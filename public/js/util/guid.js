(function (window, TrinketIO) {
  "use strict";

  function generateGUID(sep, len){
    var d = Date.now();
    return ['xxxxxxxx','xxxx','4xxx','yxxx','xxxxxxxxxxxx']
             .join(typeof sep === "string" ? sep : '-')
             .substr(0,len || 36)
             .replace(/[xy]/g, function(c) {
               var r = (d + Math.random()*16)%16 | 0;
               d = Math.floor(d/16);
               return (c=='x' ? r : (r&0x3|0x8)).toString(16);
             });
  }

  TrinketIO.export('utils.guid', generateGUID);
})(window, window.TrinketIO);
  