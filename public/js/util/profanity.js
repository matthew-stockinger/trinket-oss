/*
 * check and sanitize logic from https://github.com/jojoee/leo-profanity
 * profanities.json from https://github.com/wooorm/profanities
 *
 * NB. this check doesn't handle multi-word profanities
 */

(function (window, TrinketIO) {
  "use strict";

  // load words...
  var words;
  $.getJSON( trinketConfig.prefix("/js/util/profanities.json"), function(data, status) {
    words = data;
  });

  /**
   * Sanitize string for this project
   * 1. Convert to lower case
   * 2. Replace ~comma and dot~ non-alphabetic characters (ASCII only) with space
   * (private)
   *
   * @param {string} str
   * @returns {string}
   */
  function sanitize(str) {
    str = str.toLowerCase();
    /* eslint-disable */
    str = str.replace(/[^A-Za-z0-9]/g, ' ');

    return str;
  }

  /**
   * Check the string contain profanity words or not
   * Approach, to make it fast ASAP
   *
   * @see http://stackoverflow.com/questions/26425637/javascript-split-string-with-white-space
   * @see http://stackoverflow.com/questions/6116474/how-to-find-if-an-array-contains-a-specific-string-in-javascript-jquery
   * @see http://stackoverflow.com/questions/9141951/splitting-string-by-whitespace-without-empty-elements
   *
   * @param {string} str
   * @returns {boolean}
   */
  function check(str) {
    // Return true if profanity detected, false otherwise
    var i = 0;
    var isFound = false;

    if (!str) return isFound;

    str = sanitize(str);
    // convert into array and remove white space
    var strs = str.match(/[^ ]+/g);
    while (!isFound && i <= words.length - 1) {
      if (strs.indexOf(words[i]) >= 0) {
        isFound = true;
      }
      i++;
    }

    return isFound;
  }

  TrinketIO.export('utils.profanity', {
    check : check
  });
})(window, window.TrinketIO);
