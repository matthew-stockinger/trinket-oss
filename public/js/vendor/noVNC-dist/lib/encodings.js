System.register([], function (_export, _context) {
    "use strict";

    var encodings;
    function encodingName(num) {
        switch (num) {
            case encodings.encodingRaw:
                return "Raw";
            case encodings.encodingCopyRect:
                return "CopyRect";
            case encodings.encodingRRE:
                return "RRE";
            case encodings.encodingHextile:
                return "Hextile";
            case encodings.encodingTight:
                return "Tight";
            case encodings.encodingTightPNG:
                return "TightPNG";
            default:
                return "[unknown encoding " + num + "]";
        }
    }

    _export("encodingName", encodingName);

    return {
        setters: [],
        execute: function () {
            _export("encodings", encodings = {
                encodingRaw: 0,
                encodingCopyRect: 1,
                encodingRRE: 2,
                encodingHextile: 5,
                encodingTight: 7,
                encodingTightPNG: -260,

                pseudoEncodingQualityLevel9: -23,
                pseudoEncodingQualityLevel0: -32,
                pseudoEncodingDesktopSize: -223,
                pseudoEncodingLastRect: -224,
                pseudoEncodingCursor: -239,
                pseudoEncodingQEMUExtendedKeyEvent: -258,
                pseudoEncodingExtendedDesktopSize: -308,
                pseudoEncodingXvp: -309,
                pseudoEncodingFence: -312,
                pseudoEncodingContinuousUpdates: -313,
                pseudoEncodingCompressLevel9: -247,
                pseudoEncodingCompressLevel0: -256
            });

            _export("encodings", encodings);
        }
    };
});