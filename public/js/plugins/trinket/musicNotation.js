(function($, _, Vex, MIDI, lib) {

var NotationParser = lib.import('trinkets.music.notation');
var parser = new NotationParser();

// temporary workaround until pull request is merged
// computes bounding box even if voice starts with a ghost note
Vex.Flow.Voice.prototype.getBoundingBox = function() {
  if (!this.boundingBox) {
    if (!this.stave) throw Vex.RERR("NoStave", "Can't get bounding box without stave.");
    var stave = this.stave;
    var boundingBox = null;
    var bb;

    for (var i = 0; i < this.tickables.length; ++i) {
      this.tickables[i].setStave(stave);

      bb = this.tickables[i].getBoundingBox();
      if (!bb) continue;

      boundingBox = boundingBox ? boundingBox.mergeWith(bb) : bb;
    }

    this.boundingBox = boundingBox;
  }
  return this.boundingBox;
}

var SHARPS = ['f', 'c', 'g', 'd', 'a', 'e', 'b'];
var FLATS  = ['b', 'e', 'a', 'd', 'g', 'c', 'f'];
var NOTE_VALUES = {
  C : 0,
  D : 2,
  E : 4,
  F : 5,
  G : 7,
  A : 9,
  B : 11
};

var KEY_SIGNATURES = {};

// names of properties that should be copied into children
var PROPAGATABLE = ['key', 'time', 'clef', 'lyrics'];
// properties that can be inherited from parents
var INHERITABLE_SPECS = {
  key      : { value : 'C' }
  , time   : { value : '4/4' }
  , clef   : { value : 'treble' }
  , lyrics : { value : false }
  , label  : ''
  , voices : {
    value     : function() {return [{}];}
    , process : castArray
  }
};

var SYSTEM_CONFIG = {
  key           : INHERITABLE_SPECS.key
  , clef        : INHERITABLE_SPECS.clef
  , lyrics      : INHERITABLE_SPECS.lyrics
  , time        : INHERITABLE_SPECS.time
  , connector   : { value : 'brace single final' }
  , tempo       : { value : 60 }
  , pickup      : { value : 0 }
  , voices      : INHERITABLE_SPECS.voices
  , label       : INHERITABLE_SPECS.label
  , staves      : {
    value     : function() { return [{}]; }
    , process : castArray
  }
}

var STAVE_CONFIG = {
  key      : INHERITABLE_SPECS.key
  , label  : INHERITABLE_SPECS.label
  , clef   : INHERITABLE_SPECS.clef
  , lyrics : INHERITABLE_SPECS.lyrics
  , voices : INHERITABLE_SPECS.voices
};

var VOICE_CONFIG = {
  label    : INHERITABLE_SPECS.label
  , lyrics : INHERITABLE_SPECS.lyrics
};

// given an integer, return an array of that length
// given an array, return it
// given anything else, return an array containing that value
function castArray(value, spec) {
  var rtn;

  if (typeof value === 'number') {
    rtn = [];
    for(var i = 0; i < value; i++) {
      rtn.push({});
    }
  }
  else if (value instanceof Array) {
    rtn = value;
  }
  else if (value) {
    rtn = [value];
  }

  return rtn;
}

function getConfigValue(key, config, spec, parent) {
  var value;

  if (config.hasOwnProperty(key)) {
    value = config[key];
    if (spec[key].process) {
      value = spec[key].process(value, spec[key]);
    }
  }

  if (value === undefined) {
    // inherit from parent if value is undefined
    if (parent && INHERITABLE_SPECS.hasOwnProperty(key)) {
      value = _.clone(parent[key], true);
    }
    // check for default value if still undefined
    if (value === undefined) {
      value = spec[key].value;
      if (typeof value === 'function') {
        value = value();
      }
    }
  }

  return value;
}

function processConfig(config, spec, parent) {
  // remove invalid properties
  for(var key in config) {
    if (!spec.hasOwnProperty(key)) {
      delete(config[key]);
    }
  }

  for(var key in spec) {
    var value = getConfigValue(key, config, spec, parent);
    if (value !== undefined) {
      config[key] = value;
    }
  }

  _.each(PROPAGATABLE, function(prop) {
    if (config[prop] === undefined) {
      config[prop] = parent[prop];
    }
  });

  return config;
}

function KeyManager(keyName) {
  var key         = getKeySignature(keyName)
      , overrides = {};

  return {
    reset : function() {
      overrides = {};
      return this;
    },
    getAccidental : function(noteData) {
      var root         = noteData.key.toLowerCase().charAt(0)
          , octave     = noteData.octave
          , accidental = noteData.accidental
          , lookup     = root + octave
          , previous   = overrides[lookup];

      overrides[lookup] = accidental || 'n';

      // is specified by key?
      if (key[root]) {
        if (accidental) {
          // matches key so only show if differs from previous
          if (key[root] === accidental) {
            show = previous && previous !== accidental
          }
          // does not match key so show unless matches previous
          else {
            show = previous !== accidental;
          }
        }
        // implied natural
        else {
          // show unless previous is also natural
          show = previous !== 'n';
        }
      }
      else if (accidental) {
        // show unless matches previous
        show = previous !== accidental;
      }
      // implied natural
      else {
        // show if there was a previous non-natural
        show = previous && previous !== 'n';
      }

      return show ? (accidental || 'n') : '';
    }
  };
}

function getKeySignature(key) {
  var keySpec, keyShift, keyMap;

  if (!KEY_SIGNATURES[key]) {
    keySpec  = Vex.Flow.keySignature.keySpecs[key];
    keyShift = keySpec.acc === 'b' ? FLATS : SHARPS;
    keyMap   = {};

    _.each(keyShift.slice(0, keySpec.num), function(note) {
      keyMap[note] = keySpec.acc;
    });

    KEY_SIGNATURES[key] = keyMap;
  }

  return KEY_SIGNATURES[key];
}

function toMidi(note) {
  var semitone = 0;

  if (note.accidental && note.accidental.charAt(0) !== 'n') {
    semitone = note.accidental.length;
    if (note.accidental.charAt(0) === 'b') {
      semitone *= -1;
    }
  }

  return (note.octave+1) * 12 + NOTE_VALUES[note.key.charAt(0)] + semitone;
}

function noteParser(notes, options) {
  var parsed, msg;

  notes  = notes.replace(/^\s+|\s+$/gm,'')
  parsed = parser.parse(notes, options);
  
  return parsed;
}

function watchForChange($textarea, callback, throttle) {
  var oldVal      = $textarea.val()
      , throttled = throttle ? _.throttle(callback, throttle) : callback;

  $textarea.on("change keyup paste", function() {
    var $this        = $(this)
        , currentVal = $this.val();

    if(currentVal === oldVal) {
      return; //check to prevent multiple simultaneous triggers
    }

    throttled(currentVal, oldVal, $this);
    oldVal = currentVal;
  });
}

function colorize(obj) {
  var draw = obj.draw;

  obj.draw = function() {
    if (this.context) {
      this.context.setStrokeStyle('#008AFF');
      this.context.setFillStyle('#008AFF');
    }

    draw.call(this);

    if (this.context) {
      this.context.setStrokeStyle('black');
      this.context.setFillStyle('black');
    }
  };
}

$.widget('trinket.musicNotation', {
  options : {
    notes       : ['c d e f g a b', 'C D E F G A B']
    , lyrics    : []
    , schema    : {
        time      : '4/4',
        key       : 'C',
        tempo     : 60,
        connector : 'brace single final',
        staves    : [
          {
            clef:'treble',
            voices:[{
              label:'Treble',
              lyrics: false
            }]
          },
          {
            clef:'bass',
            voices:[{
              label:'Bass',
              lyrics: false
            }]
          },
        ]
      }
    , justified : true
  },

  _create : function() {
    var self = this;

    this.$staveContainer = this.element.find('.stave-inputs');
    this.$config         = this.element.find('textarea.configuration');
    this.$voiceTabs      = this.element.find('#editor .tabs');
    this.$voiceInputs    = this.element.find('.voice-inputs input');
    this.$output         = this.element.find('.code-output');
    this.$playCursor     = this.element.find('.play-cursor');
    this._tabCache       = {};
    this.highlight       = false;

    this.element.addClass('music-widget');

    this.canvas = this.element.find('canvas')[0];

    var renderer = new Vex.Flow.Renderer(
      this.canvas
      , Vex.Flow.Renderer.Backends.CANVAS
    );

    this.context = renderer.getContext();

    this.reset();
    
    this.instrumentsLoaded = false;

    watchForChange(
      this.element.find('textarea.configuration')
      , _.bind(this._configChanged, this)
      , 1000
    );
    watchForChange(
      this.$voiceInputs
      , _.bind(this._voiceChanged, this)
      , 1000
    );

    this.$voiceTabs.on('click', '.tab', function() {
      self._changeTab($(this));
    });

    this.$voiceInputs.on('focus', function() {
      self.highlight = $(this).data().voiceType;
      self._render();
    });
    this.$voiceInputs.on('blur', function() {
      self.highlight = false;
      self._render();
    });

    $(this.canvas).on('click', _.bind(this.play, this));
  },

  _changeTab : function($tab) {
    this.$voiceTabs.find('.tab').removeClass('active');
    $tab.addClass('active');
    var data = $tab.data();
    this.$voiceInputs.addClass('hide');
    var $input = this.$voiceInputs.filter('.' + data.voiceType);
    $input.removeClass('hide');
    $input.data(data);
    $input.val($tab.data('input-value'));
    this._render();
  },

  reset : function(options) {
    if (options) {
      _.extend(this.options, options);
    }

    // clear out the current input values
    this.$voiceTabs.find('.tab').each(function() {
      $(this).data('input-value', '');
    });

    this._originalNotes  = this.options.notes.slice();
    this._originalLyrics = this.options.lyrics.slice();
    var schema = YAML.stringify(this.options.schema, 5);
    this.$config.val(schema);
    this._configChanged(schema);
  },

  value : function() {
    var conf   = this.$config.val(),
        notes  = [],
        lyrics = [];

    this.$voiceTabs.children('.tab').each(function() {
      var data = $(this).data();
      if (data.voiceType === 'notes') {
        notes.push(data.inputValue || '');
      }
      else if (data.voiceType === 'lyrics') {
        lyrics.push(data.inputValue || '');
      }
    });

    return {
      schema : YAML.parse(conf),
      notes  : notes,
      lyrics : lyrics
    };
  },

  /* yamlConfig
  time: 3/4
  connector: bracket
  staves:
   - clef: treble
     voices: 2
   - clef: bass
     voices: 2
  */
  _configChanged : function(yamlConfig) {
    var config, beatValue, time, staves;

    this.stop();
    this.element.trigger('trinket.music-notation.change');
    $('#error-message').addClass('hide');

    try {
      config = YAML.parse(yamlConfig) || {};
      processConfig(config, SYSTEM_CONFIG);
      _.each(config.staves, function(staveConfig, staveIndex) {
        processConfig(staveConfig, STAVE_CONFIG, config);
        _.each(staveConfig.voices, function(voiceConfig, voiceIndex) {
          processConfig(voiceConfig, VOICE_CONFIG, staveConfig);
        });
      });
      this._config = config;
      this.$voiceTabs.children().detach();
      this._staves      = [];
      time = config.time.split('/');
      beatValue = Vex.Flow.RESOLUTION / (parseInt(time[1])/parseInt(time[0])) / 2;
      this.bpm  = beatValue * config.tempo;
      this.bpms = 60 * 1000 / this.bpm;
      this.bps  = 60 / this.bpm;
      this.pickup = config.pickup || 0;
      this.voiceCount = 0;
      staves = config.staves
      for (var i = 0; i < staves.length; i++) {
        this._addStave(i, staves[i]);
      }
      this._changeTab(this.$voiceTabs.find('.tab').first());
    }
    catch(e) {
      // console.log(e.stack);
      $('#error-message').text(e.message).removeClass('hide');
      return;
    }
  },

  play : function() {
    var self = this;

    if (self.isPaused) {
      self.isPaused = false;
      return self._start();
    }

    if (self.playback) {
      return self.pause();
    }

    if (self.loadingInstruments) return;

    if (self.instrumentsLoaded) {
      self._play();
      return;
    }

    $('#loading-message').removeClass('hide');
    self.loadingInstruments = true;

    MIDI.loadPlugin({
      soundfontUrl: trinketConfig.prefix('/components/midi/soundfont/'),
      instruments: 'acoustic_grand_piano',
      callback: function() {
        $('#loading-message').addClass('hide');
        self.instrumentsLoaded = true;
        self.loadingInstruments = false;
        self._play();
      }
    });
  },

  pause : function() {
    if (this.playback) {
      window.clearTimeout(this.playback);
      this.playback = undefined;
      this.isPaused = true;
      this.element.trigger('trinket.music-notation.playback-paused');
    }
  },

  _play : function() {
    var self = this,
        tickNotes = {};

    if (self.playback) {
      window.clearTimeout(self.playback);
      self.playback = undefined;
    }

    this.allTicks = [];

    _.each(this._playbackData, function(voice) {
      var tick = new Vex.Flow.Fraction(0, 1);
      _.each(voice.getTickables(), function(note) {
        var key = tick.toString();

        if (note.shouldIgnoreTicks()) {
          return;
        }

        if (!tickNotes[key]) {
          var metrics = note.getMetrics();
          var w = metrics.width;
          var x = note.getAbsoluteX() - metrics.modLeftPx - metrics.extraLeftPx;

          tickNotes[key] = {
            value      : tick.value()
            , xOffset  : Math.floor(x + w/2)
            , notes    : []
          };
        }

        if (!note.isRest()) {
          tickNotes[key].notes.push(self.getMidiNote(note));
        }

        tick.add(note.getTicks()).simplify();
      });
    });

    this.allTicks = _.sortBy(_.values(tickNotes), 'value');
    var lastTick = this.allTicks[this.allTicks.length - 1];
    var lastDuration = 0;
    _.each(lastTick.notes, function(note) {
      lastDuration = Math.max(note.duration, lastDuration);
    });
    lastTick.duration = lastDuration;

    self._tickIndex = 0;
    self._start();
  },

  _start : function() {
    this.element.trigger('trinket.music-notation.playback-started');
    this.$playCursor.removeClass('hide').css({
      height : $('#notation').attr('height') + 'px'
      , left : this.allTicks[this._tickIndex].xOffset + 'px'
    });
    var cursorX = this.$playCursor.position().left;
    var left    = this.$output.scrollLeft();
    var width   = this.$output.width();
    if (cursorX < 0) {
      this.$output.scrollLeft(left + cursorX - 30);
    }
    else if (cursorX > left + width - 30) {
      this.$output.scrollLeft(left + cursorX + 30 - width);
    }

    this._nextNote();
  },

  stop : function() {
    this.$playCursor.addClass('hide');

    this.isPaused = false;
    if (this.playback) {
      window.clearTimeout(this.playback);
      this.playback = undefined;
    }
    this.element.trigger('trinket.music-notation.playback-complete');
  },

  getMidiNote : function(vexNote) {
    var self        = this
        , note      = vexNote.getPlayNote()
        , duration  = vexNote.getTicks().value() * this.bps
        , starts    = []
        , stops     = [];

    _.each(vexNote.getKeyProps(), function(key) {
      var midiNote = toMidi(key);
      if (!key.endTie) starts.push(midiNote);
      if (!key.startTie) stops.push(midiNote);
    });

    var notePlayer = function() {
      var i;
      for(i = 0; i < starts.length; i++) {
        MIDI.noteOn(0, starts[i], 127);
      }
      for(i = 0; i < stops.length; i++) {
        MIDI.noteOff(0, stops[i], duration);
      }
    };

    notePlayer.duration = vexNote.getTicks().value();

    return notePlayer;
  },

  _nextNote : function() {
    var self = this
        , thisTick = self.allTicks[self._tickIndex]
        , nextTick = self.allTicks[self._tickIndex + 1];

    self.playback = undefined;

    if (!thisTick) {
      return;
    }

    try {
      _.each(thisTick.notes, function(note) {
        note();
      });
    } catch(e) {
      // console.log(e.stack);
    }

    var xOffset;
    if (nextTick) {
      self._tickIndex += 1;
      xOffset = nextTick.xOffset;
      delay = (nextTick.value - thisTick.value) * this.bpms;
      self.playback = window.setTimeout(_.bind(self._nextNote, self), delay);
    }
    else {
      xOffset = parseInt($('#notation').attr('width'), 10) - 30;
      delay   = thisTick.duration*this.bpms;
      self.playback = window.setTimeout(_.bind(self.stop, self), delay);
    }

    var width = this.$output.width();
    var right = this.$output.scrollLeft() + width - 30;
    if (xOffset > right) {
      this.$output.finish().animate({scrollLeft:xOffset + 30 - width}, delay, 'linear');
    }
    this.$playCursor.finish().animate({left:xOffset}, delay, 'linear');
  },

  _getVexFlowStave : function(staveConfig, staveIndex, vexFlowStaves, xOffset) {
    if (!vexFlowStaves[staveIndex]) {
      var options = {
        space_above_staff_ln: 2,
        space_below_staff_ln: 2
      };
      // we calculate the for-realz yOffset in _render but we have to provide
      // a unique one here for each stave to keep the vexflow formatter from
      // adjusting note heads of the same note but on different staves
      var yOffset = staveIndex;
      stave = new Vex.Flow.Stave(xOffset, yOffset, 0, options);
      if (staveConfig.clef) {
        stave.addClef(staveConfig.clef);
      }
      if (staveConfig.key) {
        stave.addKeySignature(staveConfig.key);
      }
      if (staveConfig.time) {
        stave.addTimeSignature(staveConfig.time)
      }

      stave.setContext(this.context);
      vexFlowStaves[staveIndex] = stave;
    }

    return vexFlowStaves[staveIndex];
  },

  _addVexFlowVoice : function(staveConfig, vexFlowStave, voiceIndex, notation, lyrics, drawables, highlight) {
    var self = this
        , time = staveConfig.time.split('/')
        , vexFlowVoice = new Vex.Flow.Voice({
            num_beats    : parseInt(time[0])
            , beat_value : parseInt(time[1])
            , resolution : Vex.Flow.RESOLUTION
          }).setStrict(false)
        , vexFlowLyrics = new Vex.Flow.Voice({
            num_beats    : parseInt(time[0])
            , beat_value : parseInt(time[1])
            , resolution : Vex.Flow.RESOLUTION
          }).setStrict(false)
        , parserOptions  = {
            clef            : staveConfig.clef
            , isMultiVoice  : staveConfig.multiVoice
            , auto_stem     : !staveConfig.multiVoice
            , isTopVoice    : voiceIndex == 0
            , lyrics        : lyrics
          }
        , totalTicks = vexFlowVoice.getTotalTicks()
        , keyManager = KeyManager(staveConfig.key)
        , highlightNotes = (highlight === 'notes')
        , highlightLyrics = (highlight === 'lyrics')
        , parsed, beams
        , pickupTicks, tickables, textLines;

    if (self.pickup) {
      var pickupFraction, oneBeatFraction, pickupNumerator, pickupDenominator;

      if (self.pickup.toString().match(/^\d+\/\d+$/)) {
        var pickup = self.pickup.split('/');
        pickupNumerator   = parseInt(pickup[0]);
        pickupDenominator = parseInt(pickup[1]);
      } else {
        pickupNumerator   = parseInt(self.pickup);
        pickupDenominator = 1;
      }

      pickupFraction  = new Vex.Flow.Fraction(pickupNumerator, pickupDenominator);
      oneBeatFraction = new Vex.Flow.Fraction(Vex.Flow.RESOLUTION / parseInt(time[1]), 1);

      pickupTicks = pickupFraction.multiply(oneBeatFraction);
    }
    else {
      pickupTicks = new Vex.Flow.Fraction(0, 0);
    }

    vexFlowVoice.setStave(vexFlowStave);

    if (!parserOptions.auto_stem) {
      parserOptions.stem_direction = staveConfig.multiVoice && voiceIndex > 0
        ? Vex.Flow.Stem.DOWN
        : Vex.Flow.Stem.UP;
    }

    parsed = noteParser(notation, parserOptions);

    tickables = parsed.vex.tickables;
    if (parsed.vex.drawables.length) {
      if (highlightNotes) {
        _.each(parsed.vex.drawables, function(drawable) {
          colorize(drawable);
        });
      }
      drawables.push.apply(drawables, parsed.vex.drawables);
    }

    // lyrics
    textLines = parsed.vex.textLines;

    vexFlowVoice.paddingTop    = parsed.padTop ? 20 : 0;
    vexFlowVoice.paddingBottom = parsed.padBottom ? 20 : 0;
    
    var currentTicks = new Vex.Flow.Fraction(0, 1);

    _.each(tickables, function(note, noteIndex) {
      note.setStave(vexFlowStave);
      if (currentTicks.equals(totalTicks)) {
        vexFlowVoice.addTickable(new Vex.Flow.BarNote(1).setStave(vexFlowStave));
        currentTicks = new Vex.Flow.Fraction(0, 1);
        keyManager.reset();

        if (textLines[noteIndex]) {
          vexFlowLyrics.addTickable(new Vex.Flow.BarNote(1));
        }
      }

      vexFlowVoice.addTickable(note);

      if (textLines[noteIndex]) {
        var lyricNote = textLines[noteIndex];
        lyricNote.setContext(self.context);
        vexFlowLyrics.addTickable(lyricNote);
        if (highlightLyrics) {
          colorize(lyricNote);
        }
      }

      // add any necessary accidentals
      if (!note.isRest()) {
        _.each(note.getKeyProps(), function(key, index) {
          var accidental = keyManager.getAccidental(key);
          if (accidental) {
            note.addAccidental(index, new Vex.Flow.Accidental(accidental));
          }
        });
      }

      if (!note.shouldIgnoreTicks()) {
        if (highlightNotes) {
          colorize(note);
        }
        currentTicks.add(note.getTicks());
      }

      if (currentTicks.equals(pickupTicks)) {
        vexFlowVoice.addTickable(new Vex.Flow.BarNote(1).setStave(vexFlowStave));
        currentTicks = new Vex.Flow.Fraction(0, 1);

        // "clear" pickupTicks after barnote added
        pickupTicks  = new Vex.Flow.Fraction(0, 0);

        if (textLines[noteIndex]) {
          vexFlowLyrics.addTickable(new Vex.Flow.BarNote(1));
        }
      }
    });

    beams = Vex.Flow.Beam.generateBeams(vexFlowVoice.getTickables(), {
      groups           : Vex.Flow.Beam.getDefaultBeamGroups(staveConfig.time)
      , stem_direction : staveConfig.multiVoice
        ? (voiceIndex === 0 ? Vex.Flow.Stem.UP : Vex.Flow.Stem.DOWN)
        : undefined
    });

    _.each(beams, function(beam) {
      if (highlightNotes) {
        colorize(beam);
      }
      drawables.push(beam);
    });

    return [ vexFlowVoice, vexFlowLyrics ];
  },

  _render: function() {
    var self             = this
        , voices         = []
        , playbackVoices = []
        , vexFlowStaves  = []
        , maxGlyphStart  = 0
        , maxVoiceLength = 0
        , xPadding       = 20
        , xOffset        = 20
        , yOffset        = 0
        , connector      = 'SINGLE ' + (self._config.connector || '').toUpperCase()
        , drawables      = []
        , vfObjects      = []
        , renderWidth;

    $('#error-message').addClass('hide').text('');
    var activeVoice = this.$voiceTabs.find('.tab.active').data() || {};

    this.$voiceTabs.children('.notes').each(function() {
      var data           = $(this).data()
          , staveIndex   = data.staveIndex
          , voiceIndex   = data.voiceIndex
          , lyrics       = []
          , staveConfig  = self._staves[staveIndex]
          , vexFlowStave = self._getVexFlowStave(staveConfig, staveIndex, vexFlowStaves, xOffset)
          , highlight    = false;

      // add lyrics to notes
      if (data.lyricsElement) {
        lyrics = data.lyricsElement.data('input-value').split(/\s+/);
      }

      if (self.highlight && voiceIndex === activeVoice.voiceIndex && staveIndex === activeVoice.staveIndex) {
        highlight = self.highlight;
      }

      var vexFlowVoices = self._addVexFlowVoice(staveConfig, vexFlowStave, voiceIndex, data.inputValue, lyrics, drawables, highlight);
      var vexFlowVoice  = vexFlowVoices[0];
      var vexFlowLyrics = vexFlowVoices[1];

      voices.push(vexFlowVoice);
      playbackVoices.push(vexFlowVoice);

      vexFlowVoice.key = staveConfig.key;

      if (!vfObjects[staveIndex]) {
        vfObjects[staveIndex] = {
          stave  : vexFlowStave,
          voices : [],
          lyrics : []
        };
      }

      vfObjects[staveIndex].voices.push(vexFlowVoice);

      if (vexFlowLyrics.getTickables().length) {
        voices.push(vexFlowLyrics);
        vfObjects[staveIndex].lyrics.push(vexFlowLyrics);
      }

      maxVoiceLength = Math.max(maxVoiceLength, vexFlowVoice.getTickables().length);
      maxGlyphStart  = Math.max(vexFlowStave.start_x, maxGlyphStart);
    });

    // equalize the stave start points -- diff key sig, etc.
    _.each(vexFlowStaves, function(stave){
      stave.start_x = maxGlyphStart;
    });

    var sorted = _.sortBy(voices, function(voice) {
      return -1*voice.getTicksUsed().value();
    });

    this._playbackData = playbackVoices;

    var formatter = new Vex.Flow.Formatter().joinVoices(sorted).format(sorted, undefined, {align_rests: false});

    renderWidth = self.options.justified
      ? Math.max(this.element.width() - xPadding*2 - maxGlyphStart, maxVoiceLength * 30)
      : Math.max(formatter.minTotalWidth,  maxVoiceLength * 25);

    if (formatter.minTotalWidth > renderWidth) {
      renderWidth = formatter.minTotalWidth + (Math.floor(formatter.minTotalWidth/100)*25);
    }

    formatter.format(sorted, renderWidth, {align_rests: false});

    var yOffset = 0;
    _.each(vfObjects, function(obj, objIndex) {
      var staveSize = obj.stave.getBoundingBox();
      var top       = 0;
      var bottom    = obj.stave.getYForLine(5);

      // lyrics location and padding
      var haveLyrics = obj.lyrics.length ? true : false;
      var setLine    = 5;
      var lyricsStave;

      _.each(obj.voices, function(voice) {
        var bb = voice.getBoundingBox();
        if (bb) {
          if (voice.paddingTop) {
            bb.y -= voice.paddingTop;
            bb.h += voice.paddingTop;
          }
          if (voice.paddingBottom) {
            bb.h += voice.paddingBottom;
          }
          top    = Math.min(bb.y, top);
          bottom = Math.max(bb.y+bb.h, bottom);
        }
      });

      if (top < 0) {
        yOffset += -1*top + 10;
      }

      obj.stave.setY(yOffset);
      yOffset += bottom;

      if (haveLyrics) {
        lyricsStave = new Vex.Flow.Stave(maxGlyphStart, yOffset, 0, {
          space_above_staff_ln: 0,
          space_below_staff_ln: 0
        });
        lyricsStave.setContext(self.context);
        _.each(obj.lyrics, function(lyrics) {
          lyrics.setStave(lyricsStave);
          _.each(lyrics.getTickables(), function(note) {
            if (note.shouldIgnoreTicks()) {
              return;
            }
            note.setStave(lyricsStave);
            note.setLine(setLine);
          });
          setLine += 2;
        });
        yOffset = lyricsStave.getYForLine(setLine-4.5);
      }
    });

    self.context.clearRect(0,0,self.canvas.width, self.canvas.height);

    self.canvas.width  = renderWidth + xPadding*2 + maxGlyphStart;
    self.canvas.height = yOffset + 50;

    _.each(vfObjects, function(obj) {
      obj.stave.setWidth(renderWidth + maxGlyphStart);
      obj.stave.draw();
      _.each(obj.voices, function(voice, voiceIndex) {
        voice.draw(self.context, obj.stave);
        if (obj.lyrics[voiceIndex]) {
          _.each(obj.lyrics[voiceIndex].getTickables(), function(note) {
            if (!note.shouldIgnoreTicks()) {
              note.draw(self.context);
            }
          });
        }
      });
    });

    if (vexFlowStaves.length > 1) {
      _.each(connector.split(/\s*\,\s*|\s+/), function(connector) {
        if (!connector) return;
        if (connector === 'FINAL') {
          connector = 'BOLD_DOUBLE_RIGHT';
        }
        var staveConnector = new Vex.Flow
          .StaveConnector(vexFlowStaves[0], vexFlowStaves[vexFlowStaves.length-1])
          .setType(Vex.Flow.StaveConnector.type[connector]);
        drawables.push(staveConnector);
      });
    }

    _.each(drawables, function(drawable, index) {
      if (drawable.setContext) {
        drawable.setContext(self.context).draw();
      }
    });
  },

  _voiceChanged : function(newValue, oldValue, $stave) {
    var data = $stave.data();

    this.stop();
    this.element.trigger('trinket.music-notation.change');
    this._tabCache[data.cacheKey].data('input-value', newValue);
    try {
      this._render();
    }
    catch(e) {
      // console.log(e.stack);
      $('#error-message').removeClass('hide').text(e.message);
    }
  },

  _addStave : function(index, staveConfig) {
    var accidental, parts
        , voices = staveConfig.voices
        , stave = {
          key      : staveConfig.key.toString()
          , clef   : staveConfig.clef
          , time   : staveConfig.time
        };

    if (!Vex.Flow.keySignature.keySpecs[stave.key]) {
      if (parts = stave.key.match(/^\s*(\-)?(\d)\s*$/)) {
        count      = parseInt(parts[2]);
        accidental = parts[1] ? 'b' : '#';
      }
      else if(parts = stave.key.match(/^\s*(\d)(b|#)\s*$/)) {
        count      = parseInt(parts[1]);
        accidental = parts[2];
      }
      else {
        throw new Error('Unrecoginized key format: ' + stave.key);
      }

      _.each(Vex.Flow.keySignature.keySpecs, function(value, key) {
        if (value.acc === accidental && value.num === count) {
          stave.key = key;
          // returning false exits the _.each loop
          return false;
        }
      });
    }

    stave.multiVoice = voices.length > 1 ? true : false;

    for(var i = 0; i < voices.length; i++) {
      this._addVoice(voices[i], index, i);
    }

    this._staves.push(stave);

    return stave;
  },

  _addVoice : function(voiceConfig, staveIndex, voiceIndex) {
    var defaultLabel = 'Voice ' + (staveIndex+1) + '.' + (voiceIndex+1);
    var $label  = $('<dt>' + (voiceConfig.label || defaultLabel) + '</dt>');
    var $notes  = this._createTab(staveIndex, voiceIndex, 'notes', this._originalNotes);
    var $lyrics = undefined;

    if (staveIndex === 0 && voiceIndex === 0) {
      $notes.addClass('active');
    }

    this.$voiceTabs.append($label, $notes);

    if (voiceConfig.lyrics) {
      $lyrics = this._createTab(staveIndex, voiceIndex, 'lyrics', this._originalLyrics);
      this.$voiceTabs.append($lyrics);
      $notes.data('lyrics-element', $lyrics);
    }
    else {
      $notes.removeData('lyrics-element');
    }

    this.voiceCount += 1;

    return this.$voiceTabs;
  },

  _createTab : function(staveIndex, voiceIndex, type, values) {
    var key  = type + staveIndex + voiceIndex;
    var $tab = this._tabCache[key];
    if (!$tab) {
      $tab = $('<dd class="tab ' + type + '"><a><i class="fa ' + type + '-tab"></i></a></dd>');
      $tab.data('stave-index', staveIndex);
      $tab.data('voice-index', voiceIndex);
      $tab.data('voice-type', type);
      $tab.data('cache-key', key);
      this._tabCache[key] = $tab;
    }

    value = values.length ? values.shift() : $tab.data('input-value');
    $tab.data('input-value', value || '');

    return $tab;
  }
});

})(window.jQuery, window._, window.Vex, window.MIDI, window.TrinketIO);
