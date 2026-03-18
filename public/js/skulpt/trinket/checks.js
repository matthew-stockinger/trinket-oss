var unittest_api = TrinketIO.import("python.editor.unittests");

var $builtinmodule = function (name) {

  var mod = {}
    , testsRun = 0;

  unittest_api.initializePlugin(); 

  // Add a successful result to the output window.
  mod.addSuccess = new Sk.builtin.func(function (testName, shortDesc, docString) {
    testsRun += 1

    unittest_api.addSuccess(Sk.ffi.remapToJs(testName), Sk.ffi.remapToJs(shortDesc), Sk.ffi.remapToJs(docString));

    unittest_api.setNumberOfTests(testsRun);

    return Sk.builtin.asnum$(0);
  });

  mod.addFailure = new Sk.builtin.func(function (testName, shortDesc, docString, reason) {
    testsRun += 1

    unittest_api.addFailure(Sk.ffi.remapToJs(testName), Sk.ffi.remapToJs(shortDesc), Sk.ffi.remapToJs(docString), Sk.ffi.remapToJs(reason));

    unittest_api.setNumberOfTests(testsRun);

    return Sk.builtin.asnum$(0);
  });
  
  mod.addError = new Sk.builtin.func(function (message, help) {
    unittest_api.addFailure("", Sk.ffi.remapToJs(message), Sk.ffi.remapToJs(message), Sk.ffi.remapToJs(help));

    return Sk.builtin.asnum$(0);
  });

  return mod
}
