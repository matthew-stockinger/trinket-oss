(function(Trinket) {
  function ActivityLog(analyticsFn) {
    this._pollInterval = undefined;
    this._analytics    = analyticsFn;
    this._events       = {};
    $(window).on('blur', $.proxy(this.poll, this));
  }

  ActivityLog.POLL_INTERVAL = 30000;

  ActivityLog.prototype.poll = function() {
    if (!this._pollInterval) return;

    for(var type in this._events) {
      if (this._events[type]) {
        this._analytics(type, this._events[type]);
      }
      this._events[type] = 0;
    }

    clearTimeout(this._pollInterval);
    this._pollInterval = undefined;
  };

  ActivityLog.prototype.logEvent = function(type) {
    var self = this;

    self._events[type] = (self._events[type] || 0) + 1;

    if (this._pollInterval) return;
    
    this._pollInterval = setTimeout(
      $.proxy(this.poll, this)
      , ActivityLog.POLL_INTERVAL
    );
  };

  Trinket.export('embed.analytics.activity', ActivityLog);
})(window.TrinketIO);