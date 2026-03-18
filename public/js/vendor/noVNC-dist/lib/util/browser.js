System.register(['./logging.js'], function (_export, _context) {
    "use strict";

    var Log, isTouchDevice, _cursor_uris_supported;

    function supportsCursorURIs() {
        if (_cursor_uris_supported === null) {
            try {
                var target = document.createElement('canvas');
                target.style.cursor = 'url("data:image/x-icon;base64,AAACAAEACAgAAAIAAgA4AQAAFgAAACgAAAAIAAAAEAAAAAEAIAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAA==") 2 2, default';

                if (target.style.cursor) {
                    Log.Info("Data URI scheme cursor supported");
                    _cursor_uris_supported = true;
                } else {
                    Log.Warn("Data URI scheme cursor not supported");
                    _cursor_uris_supported = false;
                }
            } catch (exc) {
                Log.Error("Data URI scheme cursor test exception: " + exc);
                _cursor_uris_supported = false;
            }
        }

        return _cursor_uris_supported;
    }
    _export('supportsCursorURIs', supportsCursorURIs);

    function isMac() {
        return navigator && !!/mac/i.exec(navigator.platform);
    }

    _export('isMac', isMac);

    function isIE() {
        return navigator && !!/trident/i.exec(navigator.userAgent);
    }

    _export('isIE', isIE);

    function isEdge() {
        return navigator && !!/edge/i.exec(navigator.userAgent);
    }

    _export('isEdge', isEdge);

    function isFirefox() {
        return navigator && !!/firefox/i.exec(navigator.userAgent);
    }

    _export('isFirefox', isFirefox);

    function isWindows() {
        return navigator && !!/win/i.exec(navigator.platform);
    }

    _export('isWindows', isWindows);

    function isIOS() {
        return navigator && (!!/ipad/i.exec(navigator.platform) || !!/iphone/i.exec(navigator.platform) || !!/ipod/i.exec(navigator.platform));
    }

    _export('isIOS', isIOS);

    return {
        setters: [function (_loggingJs) {
            Log = _loggingJs;
        }],
        execute: function () {
            _export('isTouchDevice', isTouchDevice = 'ontouchstart' in document.documentElement ||
            // requried for Chrome debugger
            document.ontouchstart !== undefined ||
            // required for MS Surface
            navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);

            _export('isTouchDevice', isTouchDevice);

            window.addEventListener('touchstart', function onFirstTouch() {
                _export('isTouchDevice', isTouchDevice = true);
                window.removeEventListener('touchstart', onFirstTouch, false);
            }, false);

            _cursor_uris_supported = null;
            ;
        }
    };
});