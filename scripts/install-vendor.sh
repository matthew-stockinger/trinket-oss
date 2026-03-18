#!/bin/bash
# Install vendor dependencies for embed/editor to work

VENDOR_DIR="public/vendor"
mkdir -p "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR/src-min-noconflict"
mkdir -p "$VENDOR_DIR/css"
mkdir -p "$VENDOR_DIR/dist"
mkdir -p "$VENDOR_DIR/js/browser"

cd "$(dirname "$0")/.."

echo "Installing vendor dependencies..."

# Ace Editor (from cdnjs)
echo "Downloading Ace Editor..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/ace.min.js" -o "$VENDOR_DIR/src-min-noconflict/ace.js"
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/ext-modelist.min.js" -o "$VENDOR_DIR/src-min-noconflict/ext-modelist.js"
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/ext-language_tools.min.js" -o "$VENDOR_DIR/src-min-noconflict/ext-language_tools.js"
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/mode-python.min.js" -o "$VENDOR_DIR/src-min-noconflict/mode-python.js"
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/theme-chrome.min.js" -o "$VENDOR_DIR/src-min-noconflict/theme-chrome.js"
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/worker-base.min.js" -o "$VENDOR_DIR/src-min-noconflict/worker-base.js"

# jsdiff
echo "Downloading jsdiff..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.1.0/diff.min.js" -o "$VENDOR_DIR/diff.js"

# jszip
echo "Downloading jszip..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" -o "$VENDOR_DIR/dist/jszip.min.js"

# jszip-utils
echo "Downloading jszip-utils..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js" -o "$VENDOR_DIR/jszip-utils.min.js"

# FileSaver
echo "Downloading FileSaver..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js" -o "$VENDOR_DIR/FileSaver.js"

# lodash
echo "Downloading lodash..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js" -o "$VENDOR_DIR/dist/lodash.min.js"

# bluebird
echo "Downloading bluebird..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js" -o "$VENDOR_DIR/js/browser/bluebird.min.js"

# font-mfizz (icon font)
echo "Downloading font-mfizz..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/font-mfizz/2.4.1/font-mfizz.min.css" -o "$VENDOR_DIR/css/font-mfizz.css"

echo "Vendor dependencies installed!"
echo ""
echo "Note: Skulpt files still need to be configured. Either:"
echo "  1. Set config.app.embed.skulpt.local=true and install skulpt to public/components/skulpt/"
echo "  2. Configure a valid CDN URL for skulpt files"
