(function () {
"use strict";

/** from: https://stackoverflow.com/questions/25140723/constructor-name-is-undefined-in-internet-explorer
 * Hack in support for Function.name for browsers that don't support it.
 * IE, I'm looking at you.
**/
if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
  Object.defineProperty(Function.prototype, 'name', {
    get: function() {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = (funcNameRegex).exec((this).toString());
      return (results && results.length > 1) ? results[1].trim() : "";
    },
    set: function(value) {}
  });
}

function walkAST(ast, table) {
  var type = ast && ast._astname
    , i, j, field;

  if (!type) return;

  if (type === "Call") {
    if (ast.func.constructor.name === "Name") {
      table[type].push( ast.func.id.v );
    }
    else if (ast.func.constructor.name === "Attribute") {
      table[type].push( ast.func.attr.v );
    }
  }
  else if (type === "Attribute") {
    table[type].push( ast.attr.v );
  }
  else if (type === "ImportFrom") {
    table["Import"].push( ast.module.v );
  }
  else if (type === "Import") {
    for (i = 0; i < ast.names.length; i++) {
      table["Import"].push( ast.names[i].name.v );
    }
  }

  if (ast._fields) {
    for (i = 0; i < ast._fields.length; i+=2) {
      field = ast._fields[i+1](ast);
      if (!field) continue;

      if (field._astname) {
        walkAST(field, table);
      }
      else if (field.constructor === Array && field.length && field[0] && field[0]._astname) {
        for (j = 0; j < field.length; j++) {
          walkAST(field[j], table);
        }
      }
    }
  }
}

function parseCode(editor) {
  var fileName = "main.py"
    , code     = editor.getValue()
    , parse, ast
    , table    = {
          "Call"      : []
        , "Attribute" : []
        , "Import"    : []
      };

  try {
    parse = Sk.parse(fileName, code);
    ast   = Sk.astFromParse(parse.cst, fileName, parse.flags);
  }
  catch(e) {
    // TODO: what if code failed to parse?
    return;
  }

  walkAST(ast, table);

  return table;
}

window.TrinketIO.export("skulpt.ast", {
  parseCode : parseCode
});

})();
