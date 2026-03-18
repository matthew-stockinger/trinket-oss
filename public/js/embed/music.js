(function(window, $) {
  var api,
      newModification = true,
      newPlayback     = true;

  function getOptions(trinket) {
    var intialValue, options;

    if (trinket && trinket.code) {
      initialValue = trinket.code;
    }

    try {
      options = initialValue ? JSON.parse(initialValue) : {};
    }
    catch(e) {
      options = {};
    }

    return options;
  }

  window.TrinketAPI = {
    initialize : function(trinket) {
      api = this;

      var $play  = $('.fa-play').parent();
      var $pause = $('.fa-pause').parent();

      this.widget = $('.notation-widget').musicNotation(getOptions(trinket)).data('trinket-musicNotation');
      $('.notation-widget').on('trinket.music-notation.change', function() {
        api.triggerChange();

        if (newModification) {
          api.sendAnalytics('Interaction', {
            action   : 'Modify',
            label    : 'Code'
          });
          newModification = false;
        }
        newPlayback = true;
      });

      $('.notation-widget').on('trinket.music-notation.playback-started', function() {
        $play.addClass('hide');
        $pause.removeClass('hide');

        if (newPlayback) {
          api.updateMetric('runs', api.getValue());
          api.sendAnalytics('Interaction', {
            action : 'Play',
            label : 'Code'
          });
          newPlayback = false;
        }
        newModification = true;
      });

      $('.notation-widget').on('trinket.music-notation.playback-complete trinket.music-notation.playback-paused', function() {
        $play.removeClass('hide');
        $pause.addClass('hide');
      });

      $(document).on('trinket.code.config',     $.proxy(this.toggleConfig, this));
      $(document).on('trinket.code.play',       $.proxy(api.widget.play, api.widget));
      $(document).on('trinket.code.pause',      $.proxy(api.widget.pause, api.widget));
      $(document).on('trinket.code.stop',       $.proxy(api.widget.stop, api.widget));
      $(document).on('trinket.code.cheatsheet', $.proxy(this.toggleCheatsheet, this));

      window.readyForSnapshot = true;
    },

    getEmbedSize : function() {
      return {
        height: 200
      };
    },

    getType  : function() {
      return 'music';
    },

    getValue : function() {
      var data = this.widget.value();
      return JSON.stringify(data);
    },

    getAnalyticsCategory : function() {
      return 'Music';
    },

    toggleConfig : function() {
      api.closeOverlay('#cheatsheet');
      api.toggleOverlay('#config');
    },

    toggleCheatsheet : function() {
      api.closeOverlay('#config');
      api.toggleOverlay('#cheatsheet');
    },

    focus : function() {
      $('input.notes').focus();
    },

    hideAll : function() {
      api.closeOverlay('#config');
      api.closeOverlay('#cheatsheet');
      $('#viewer').removeClass('hide');
    },

    onOpenOverlay : function() {
      $('#viewer').addClass('hide');
    },

    onCloseOverlay : function() {
      $('#viewer').removeClass('hide');
    },

    reset : function(trinket) {
      this.widget.reset(getOptions(trinket));
    }
  };
})(window, window.jQuery);
