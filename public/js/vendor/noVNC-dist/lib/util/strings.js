System.register([], function (_export, _context) {
  "use strict";

  /*
   * noVNC: HTML5 VNC client
   * Copyright (C) 2012 Joel Martin
   * Licensed under MPL 2.0 (see LICENSE.txt)
   *
   * See README.md for usage and integration instructions.
   */

  /*
   * Decode from UTF-8
   */
  function decodeUTF8(utf8string) {
    "use strict";

    return decodeURIComponent(escape(utf8string));
  }
  _export("decodeUTF8", decodeUTF8);

  return {
    setters: [],
    execute: function () {
      ;
    }
  };
});