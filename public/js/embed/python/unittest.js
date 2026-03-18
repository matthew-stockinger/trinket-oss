(function () {
  var numberOfTestsRun
    , numberOfTests
    , testsPassed
    , template = window.TrinketIO.import('utils.template');

  function addTest() {
  }

  function setNumberOfTests(numTests) {
    numberOfTests = numTests;
    $('#test-totals').html(testsPassed + " out of " + numberOfTests + " tests passed");
  }

  function addSuccess(testName, shortDesc, docString) {
    numberOfTestsRun += 1;
    testsPassed += 1;
    var test = template('unittest-pass', {
      testNumber: numberOfTestsRun,
      shortDescription: shortDesc,
      description: docString
    });
    $('#unittest-accordion').append($(test));
    $('#test-totals').html(testsPassed + " out of " + numberOfTests + " tests passed");
    $(document).foundation();
  }

  function addFailure(testName, shortDesc, docString, reason) {
    numberOfTestsRun += 1;
    var reason = reason.replace('\n', "<br>");
    var test = template('unittest-fail', {
      testNumber: numberOfTestsRun,
      shortDescription: shortDesc,
      description: docString,
      reason: reason
    });
    $('#unittest-accordion').append($(test));
    $(document).foundation();
  }

  function addError(shortDesc, reason) {
    numberOfTestsRun += 1;
    var reason = reason.replace('\n', "<br>");
    var test = template('unittest-error', {
      testNumber: numberOfTestsRun,
      shortDescription: shortDesc,
      reason: reason
    });
    $('#unittest-accordion').append($(test));
    $(document).foundation();
  }
  
  function getNumberOfTestsRun() {
    return numberOfTestsRun;
  }

  //add skip
  //add expectedFailure
  //add unexpectedSuccess

  window.TrinketIO.export("python.editor.unittests", {
    initializePlugin: function() {
      numberOfTestsRun = 0;
      numberOfTests = 0;
      testsPassed = 0;
      $('li.accordion-navigation').remove();
      $('#unittest-accordion').on('toggled', function (event, accordion) {
        var oldaccordion = $('.open-close-indicator.fa-angle-down');
        oldaccordion.addClass('fa-angle-right');
        oldaccordion.removeClass('fa-angle-down');

        if ($('.content.active').length) {
          var tag = $(accordion).parent().find('.open-close-indicator');
          tag.removeClass('fa-angle-right');
          tag.addClass('fa-angle-down');
        }
      });
    },

    addTest: addTest,
    addSuccess: addSuccess,
    addFailure: addFailure,
    addError: addError,
    setNumberOfTests: setNumberOfTests,
    getNumberOfTestsRun: getNumberOfTestsRun
  });
}());
