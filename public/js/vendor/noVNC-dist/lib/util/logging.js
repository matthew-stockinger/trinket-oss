System.register([], function (_export, _context) {
    "use strict";

    var _log_level, Debug, Info, Warn, Error;

    function init_logging(level) {
        if (typeof level === 'undefined') {
            level = _log_level;
        } else {
            _log_level = level;
        }

        _export('Debug', Debug = _export('Info', Info = _export('Warn', Warn = _export('Error', Error = function (msg) {}))));
        if (typeof window.console !== "undefined") {
            switch (level) {
                case 'debug':
                    _export('Debug', Debug = console.debug.bind(window.console));
                case 'info':
                    _export('Info', Info = console.info.bind(window.console));
                case 'warn':
                    _export('Warn', Warn = console.warn.bind(window.console));
                case 'error':
                    _export('Error', Error = console.error.bind(window.console));
                case 'none':
                    break;
                default:
                    throw new Error("invalid logging type '" + level + "'");
            }
        }
    }
    _export('init_logging', init_logging);

    function get_logging() {
        return _log_level;
    }
    _export('get_logging', get_logging);

    return {
        setters: [],
        execute: function () {
            _log_level = 'warn';

            _export('Debug', Debug = function (msg) {});

            _export('Info', Info = function (msg) {});

            _export('Warn', Warn = function (msg) {});

            _export('Error', Error = function (msg) {});

            ;
            ;

            _export('Debug', Debug);

            _export('Info', Info);

            _export('Warn', Warn);

            _export('Error', Error);

            // Initialize logging level
            init_logging();
        }
    };
});