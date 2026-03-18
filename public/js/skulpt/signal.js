(function(TrinketIO) {

TrinketIO.export('sendSignalToSkulpt', function(signal) {
  if (Sk.signals != null && Sk.signals.signal != null) {
    Sk.signals.signal(signal);
  }
});

})(window.TrinketIO);
