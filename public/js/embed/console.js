(function($, window, TrinketIO) {
  var history   = [],
      api;

  var emptyline = /^\s*$/;
  var jqconsole = $('#console').jqconsole('Interactive Python Console\n');
  var Skulpt = TrinketIO.import('Skulpt');
  var evaluate = Skulpt({
    evalMode      : 'repl',
    autoEscape    : false,
    allowGraphics : false,
    write : function(text) {
      jqconsole.Write(text, 'jqconsole-output');
    },
    error : function(msg) {
      jqconsole.Write(msg, 'jqconsole-output error');
    }
  });

  jqconsole.RegisterShortcut('A', function() {
    jqconsole.MoveToStart();
  });

  jqconsole.RegisterShortcut('E', function() {
    jqconsole.MoveToEnd();
  });

  jqconsole.RegisterShortcut('K', function() {
    jqconsole.Clear();
  });

  $(document).on('sk.system.clear', function() {
    jqconsole.Clear();
  });

  var startPrompt = function () {
    // Start the prompt with history enabled.
    var inMultilineString = false;
    jqconsole.Prompt(true, function (input) {
      if (input.match(/^\s*credits\s*$/)) {
        jqconsole.Write('Many thanks to the maintainers of Skulpt.  See skulpt.org for details.\n');
        startPrompt();
      }
      else if (!emptyline.test(input)) {
        evaluate(input, function() {
          startPrompt();
        }, function(err) {
          startPrompt();
        }, function() {
          // execution halted!
        });
        history.push(
          input.replace(/(\\[nr])/g, '\\$1')
               .replace(/\n/g, "\\n")
               .replace(/\r/g, "\\r")
        );
        api.sendAnalytics('Interaction', {
          action   : 'Modify',
          label    : 'Code'
        });
        api.triggerChange();
      }
      else {
        startPrompt();
      }
    }, function(input) {
      var indent, last_line, lines;
      lines = input.split('\n');
      if (lines.length === 0) {
        return 0;
      } else {
        last_line = lines[lines.length - 1];
        indent = last_line.match(/^\s*/)[0];
        last_line = lines[lines.length - 1].replace(/\s+$/, '');
        if (/"""/.test(last_line) && !/""".*"""/.test(last_line)) {
          inMultilineString = !inMultilineString;
        }

        if (inMultilineString) {
          return 0;
        } else if (!/^\s*#/.test(last_line) && last_line[last_line.length - 1] === ':') {
          return 1;
        } else if (indent.length && last_line && last_line[last_line.length - 1].length !== 0) {
          return 0;
        } else {
          return false;
        }
      }
    });
    jqconsole.Focus();
  };

  window.TrinketAPI = {
    initialize : function(trinket) {
      var input, commands = [];

      api = this;
      jqconsole.Reset();

      history = (trinket && trinket.code) ? trinket.code.split('\n') : [];

      for(var i = 0; i < history.length; i++) {
        input = history[i]
          .replace(/([^\\])\\n/g, '$1\n')
          .replace(/([^\\])\\r/g, '$1\r')
          .replace(/\\(\\[nr])/g, '$1');

        jqconsole.Write('>>> ' + input.replace(/(\n|\r)/g, '$1... ') + '\n', 'jqconsole-old-prompt');
        evaluate(input);
        commands.push(input);
      }

      jqconsole.SetHistory(commands);

      jqconsole.Write(">>> ", "fake-prompt");

      $('body').one('click', function() {
        // remove the fake placeholder prompt
        $('.fake-prompt').remove();
        // start the actual prompt
        startPrompt();
      });

      window.readyForSnapshot = true;

      var info = api.getEmbedInfo;
      api.getEmbedInfo = function(trinket) {
        return $.extend(info.call(api, trinket), api.getEmbedSize());
      };
    },
    getEmbedSize : function() {
      return {
        height: 200
      };
    },
    getType  : function() {
      return 'console';
    },
    getValue : function() {
      var result = [];
      for(var i = 0; i < history.length; i++) {
        result[i] = history[i].replace('\n', '\\n');
      }
      return result.join('\n');
    },
    getAnalyticsCategory : function() {
      return 'Console';
    },
    reset : function(trinket) {
      this.initialize(trinket);
    }
  };
})(jQuery, window, window.TrinketIO);
