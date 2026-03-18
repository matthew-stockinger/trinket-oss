(function(Trinket) {
  var janus     = null
    , streaming = null
    , opaqueId  = "pygameaudio-" + Janus.randomString(12)
    , janusUrl, janusReady;

  // TODO: reuse or destroy...

  function janus_init(_url, ready) {
    janusUrl   = _url;
    janusReady = ready;

    /*
    Janus.init({
        debug : "all"
      , callback : initCallback
    });
    */
    // temporarily disable Janus connection until it can be fixed/upgraded
    ready();
  }

  function initCallback() {
    if (Janus.isWebrtcSupported()) {
      janus = new Janus({
          server    : janusUrl
        , success   : function() {
            janus.attach({
                plugin   : "janus.plugin.streaming"
              , opaqueId : opaqueId
              , success  : function(pluginHandle) {
                  streaming = pluginHandle;
                  Janus.log("Plugin attached! (" + streaming.getPlugin() + ", id=" + streaming.getId() + ")");

                  // only one stream configured on server
                  var selectedStream = 1;
                  var body = { "request" : "watch", id : selectedStream };
                  streaming.send({ "message" : body });
                }
              , error : function(error) {
                  Janus.error("  -- Error attaching plugin... ", error);
                }
              , onmessage : function(msg, jsep) {
                  Janus.debug(" ::: Got a message :::");
                  Janus.debug(msg);
                  var result = msg.result;
                  if (result !== null && result !== undefined) {
                    if (result.status !== undefined && result.status !== null) {
                      var status = result.status;
                      if (status === 'starting') {
                        //$('#status').removeClass('hide').text("Starting, please wait...").show();
                      }
                      else if (status === 'started') {
                        //$('#status').removeClass('hide').text("Started").show();
                      }
                      else if (status === 'stopped') {
                        stopStream();
                      }
                    }
                    else if (msg.streaming === "event") {
                      Janus.debug(" ::: event ::: ");
                      Janus.debug(result);
                    }
                  }
                  else if (msg.error !== undefined && msg.error !== null) {
                    Janus.error(msg.error);
                    stopStream();
                    return;
                  }

                  if (jsep !== undefined && jsep !== null) {
                    Janus.debug("Handling SDP as well...");
                    Janus.debug(jsep);

                    // Offer from the plugin, let's answer
                    try {
                      streaming.createAnswer({
                          jsep    : jsep
                        , media   : { audioSend: false, videoSend: false }  // We want recvonly audio/video
                        , success : function(jsep) {
                            Janus.debug("Got SDP!");
                            Janus.debug(jsep);
                            var body = { "request" : "start" };
                            streaming.send({ "message" : body, "jsep" : jsep });
                          }
                        , error   : function(error) {
                            Janus.error("WebRTC error:", error);
                          }
                      });
                    } catch(e) {
                      // if webrtc blocked
                      janusReady();
                    }
                  }
                }
              , onremotestream : function(stream) {
                  Janus.debug(" ::: Got a remote stream :::");
                  Janus.debug(stream);

                  $('#audiostream').append('<video id="remoteaudiostream" width=1 height=1 autoplay />');
                  Janus.attachMediaStream($('#remoteaudiostream').get(0), stream);

                  Janus.debug(" ::: Calling ready :::");
                  janusReady();
                }
              , oncleanup : function() {
                  Janus.log(" ::: Got a cleanup notification :::");
                }
            });
          }
        , error : function(error) {
            Janus.error(error);
            janusReady();
          }
        , destroyed : function() {
            Janus.log(" ::: janus destroyed? :::");
          }
      });
    }
    else {
      janusReady();
    }
  }

  function stopStream() {
    var body = { "request" : "stop" };
    streaming.send({ "message" : body });
    streaming.hangup();
    janus.destroy();
  }

  Trinket.export('audiostream.api', {
      connect    : janus_init
    , disconnect : stopStream
  });
})(window.TrinketIO);
