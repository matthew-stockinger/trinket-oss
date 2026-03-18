System.register([], function (_export, _context) {
  "use strict";

  var Buf8, Buf16, Buf32;
  // reduce buffer size, avoiding mem copy
  function shrinkBuf(buf, size) {
    if (buf.length === size) {
      return buf;
    }
    if (buf.subarray) {
      return buf.subarray(0, size);
    }
    buf.length = size;
    return buf;
  }
  _export("shrinkBuf", shrinkBuf);

  function arraySet(dest, src, src_offs, len, dest_offs) {
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
      return;
    }
    // Fallback to ordinary array
    for (var i = 0; i < len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  }

  // Join array of chunks to single array.

  _export("arraySet", arraySet);

  function flattenChunks(chunks) {
    var i, l, len, pos, chunk, result;

    // calculate data length
    len = 0;
    for (i = 0, l = chunks.length; i < l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = new Uint8Array(len);
    pos = 0;
    for (i = 0, l = chunks.length; i < l; i++) {
      chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }

  _export("flattenChunks", flattenChunks);

  return {
    setters: [],
    execute: function () {
      ;
      _export("Buf8", Buf8 = Uint8Array);

      _export("Buf8", Buf8);

      _export("Buf16", Buf16 = Uint16Array);

      _export("Buf16", Buf16);

      _export("Buf32", Buf32 = Int32Array);

      _export("Buf32", Buf32);
    }
  };
});