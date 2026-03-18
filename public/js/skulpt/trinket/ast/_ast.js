var $builtinmodule = function () {
   function remapToPy(obj) {
     var k;
     var kvs;
     var i;
     var arr;
     if (Object.prototype.toString.call(obj) === "[object Array]") {
       arr = [];
       for (i = 0; i < obj.length; ++i) {
         arr.push(remapToPy(obj[i]));
       }
       return new Sk.builtin.list(arr);
     } else if (typeof obj === "object") {
       if (obj && obj.ob$type) {
         return obj;
       } else {
         kvs = [];
         for (k in obj) {
           kvs.push(remapToPy(k));
           kvs.push(remapToPy(obj[k]));
         }
         return new Sk.builtin.dict(kvs);
       }
     } else if (typeof obj === "string") {
       return new Sk.builtin.str(obj);
     } else if (typeof obj === "number") {
       return Sk.builtin.assk$(obj);
     } else if (typeof obj === "boolean") {
       return obj;
     } else if (typeof obj === "undefined") {
       return Sk.builtin.none$;
     } else {
    //   console.log(obj);
    //   console.log(typeof obj);
    //   console.log(obj.name);
       if (obj.name) {
        return remapToPy(obj.name);
       }
     }
   }

   var trinket = {
      parse: function(source) {
        var parse = Sk.parse('whatever.py', Sk.ffi.remapToJs(source));
        var ast = Sk.astFromParse(parse.cst, 'whatever.py', parse.flags);
        // console.log(ast);
        var pyAst = remapToPy(ast);
        // console.log(pyAst);
        return pyAst;
      }
    };

    return trinket;
};
