var $builtinmodule = function (name) {
  var mod = {};

  function permutator(iterable, r) {
    var list     = iterable.slice(),
        n        = list.length,
        indices  = [],
        cycles   = [],
        res      = [],
        first    = true,
        i, j,swap;

    r = r === undefined ? n : r;

    for (i = 0; i < n; i++) {
      indices[i] = i;
    }

    for (i = n+1; --i >= n-r+1;) {
      cycles.push(i);
    }
        
    var genResult = function() {
      return indices.slice(0,r).map(function(v) { return list[v]; });
    };

    return { 
      next : function() {
        if (first) {
          first = false;
          return genResult();
        }

        for (i = r; --i >= 0;) {
          cycles[i] -= 1;
          if (cycles[i] === 0) {
            indices = indices.slice(0,i).concat(indices.slice(i+1), indices.slice(i,i+1));
            cycles[i] = n - i;
          }
          else {
            j = cycles[i];
            swap = indices[i];
            indices[i] = indices[n-j];
            indices[n-j] = swap;
            return genResult();
          }
        }

        return undefined;
      }
    };
  }

  mod.permutations = new Sk.builtin.func(function (iterable, r) {
    var arr, permutations, i, n;

    if (iterable instanceof Sk.builtin.str) {
      arr = iterable.v.split("");
      for (i = 0; i < arr.length; i++) {
        arr[i] = Sk.builtin.str(arr[i]);
      }
    }
    else if (iterable instanceof Sk.builtin.list || iterable instanceof Sk.builtin.tuple) {
      arr = [];
      for (i = 0; i < iterable.v.length; i++) {
        arr.push(iterable.v[i]);
      }
    }

    permutations = permutator(arr, Sk.builtin.asnum$(r));

    return Sk.builtin.makeGenerator(function () {
      n = permutations.next();
      this.$index++;
      return n === undefined ? undefined : Sk.builtin.tuple(n);
    }, {
      $obj: this,
      $index: 0
    });
  });

  return mod;
};
