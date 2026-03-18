(function(lib, _, Vex) {

lib.export('trinkets.music.notation', Parser);

function Parser() {
  this.parser = lib.import('trinkets.music.parser');
  this.tuning = new Vex.Flow.Tuning();
  _.bindAll(this, ['setPitch', 'addNote', 'nextEntity']);
}

_.extend(Parser.prototype, {
  parse : function(notation, options) {
    this.options  = options;
    this.vex      = {
      tickables : [],
      drawables : [],
      textLines : []
    };
    this.state    = {};
    this.lyrics   = options.lyrics || [];
    this.vexNoteOptions = {
      clef             : options.clef || 'treble'
      , auto_stem      : options.auto_stem
      , stem_direction : options.stem_direction
      , duration       : "4"
    };
    this.padTop    = false;
    this.padBottom = false;

    if (!notation) return this;

    var entities;
    try {
      entities = this.parser.parse(notation);
    } catch(e) {
      throw new Error("\nSyntax error\n"
        + e.message.split('\n').splice(1,3).join('\n')
      );
    }

    _.each(entities, this.nextEntity);

    return this;
  },

  nextEntity : function(entity) {
    switch(entity.type) {
      case 'note':
        this.addNote(entity);
      break;
      case 'rest':
        this.addRest(entity);
      break;
      case 'spacer':
        this.addSpacer(entity);
      break;
      case 'chord':
        this.addChord(entity);
      break;
      case 'tuplet':
        this.addTuplet(entity);
      break;
    }

    return this;
  },

  addLyric : function(note) {
    var lyric = this.lyrics.shift();

    if (typeof(lyric) !== 'undefined' && lyric.length) {
      var vexTextNote = new Vex.Flow.TextNote({
        text     : lyric === '~' ? '' : lyric,
        duration : note.duration
      });

      this.vex.textLines.push(vexTextNote);

      // set for potential use in addTuplet
      note._lyric_index = this.vex.textLines.length - 1;
    }

    return this;
  },
  
  addToStream : function(note) {
    this.vex.tickables.push(note.vexNote);

    return this;
  },

  setDuration : function(note) {
    if (note.duration && note.duration.charAt(0) === '.') {
      note.duration = this.vexNoteOptions.duration + note.duration;
    }

    note.duration = this.vexNoteOptions.duration =
      (note.duration || this.vexNoteOptions.duration).replace('.', 'd');

    return this;
  },

  setVexNote : function(note, options) {
    options = _.extend({
      keys       : [].concat(note.pitch)
      , duration : note.duration
    }, this.vexNoteOptions, options || {});

    note.vexNote = options.ghost
      ? new Vex.Flow.GhostNote(options.duration)
      : new Vex.Flow.StaveNote(options);

    note.vexNote.setPlayNote(note);
    
    if (note.duration.indexOf('d') > -1) {
      note.vexNote.addDotToAll();
    }
    
    return this;
  },

  setPitch : function(note) {
    note.pitch = note.name + (note.accidental || '') + '/' + (note.octave-1);

    return this;
  },

  setRestPitch : function(rest) {
    var fret;
    if (this.options.isMultiVoice) {
      // compute the note that corresponds to the appropriate line
      // on the stave for the rest to render
      // stave lines are number 1-9
      fret = this.options.isTopVoice
        // give special treatment to top voice half notes
        ? (rest.duration.match(/^2d*$/) ? 6 : 8)
        // give special treatment to bottom voice whole notes
        : (rest.duration.match(/^1d*$/) ? 3 : 1);

      // magical formula lifted from vextab artist.coffee for getting a note
      rest.pitch = this.tuning.getNoteForFret((fret + 5) * 2, 6);
    }
    else {
      // use vexflow default rest positioning
      rest.pitch = 'r/4';
    }

    return this;
  },

  addNote : function(note) {
    return this.setDuration(note)
      .setPitch(note)
      .setVexNote(note)
      .addLyric(note)
      .addTies(note)
      .addToStream(note);
  },

  addRest : function(rest) {
    return this.setDuration(rest)
      .setRestPitch(rest)
      // assign a fixed clef so rests always appear on the same stave lines
      .setVexNote(rest, {clef: 'treble', duration: rest.duration+'r'})
      .addLyric(rest)
      .clearTies()
      .addToStream(rest);
  },

  addSpacer : function(rest) {
    return this.setDuration(rest)
      .setVexNote(rest, {ghost:true, duration: rest.duration+'r'})
      .addLyric(rest)
      .clearTies()
      .addToStream(rest);
  },

  addChord : function(chord) {
    _.each(chord.notes, this.setPitch);
    chord.pitch = _.pluck(chord.notes, 'pitch');

    return this.setDuration(chord)
      .setVexNote(chord)
      .addLyric(chord)
      .addTies(chord)
      .addToStream(chord);
  },

  addTuplet : function(tuplet) {
    var vexNotes, location;
    var self = this;

    _.each(tuplet.notes, this.addNote);
    vexNotes = _.pluck(tuplet.notes, 'vexNote');
    location = this.getTupletLocation(vexNotes);

    tuplet.vexTuplet = new Vex.Flow
      .Tuplet(vexNotes, {beats_occupied : tuplet.beats})
      .setTupletLocation(location);

    this.vex.drawables.push(tuplet.vexTuplet);
        
    _.each(tuplet.notes, function(note) {
      note.tuplet = tuplet;
      if (typeof(note._lyric_index) !== 'undefined') {
        self.vex.textLines[note._lyric_index].ticks = note.vexNote.getTicks();
      }
    });
    
    return this;
  },
  
  getTupletLocation : function(vexNotes) {
    var self = this
        , location = Vex.Flow.Tuplet.LOCATION_BOTTOM;

    if (this.options.auto_stem) {
      _.each(vexNotes, function(note) {
        if (note.getStemDirection() === Vex.Flow.Stem.UP) {
          location = Vex.Flow.Tuplet.LOCATION_TOP;
          self.padTop = true;
          return false;
        }
      });
    }
    else if (this.options.stem_direction === Vex.Flow.Stem.UP) {
      location = Vex.Flow.Tuplet.LOCATION_TOP;
      self.padTop = true;
    }
    else {
      self.padBottom = true;
    }

    (location === Vex.Flow.Tuplet.LOCATION_BOTTOM)
      ? this.padBottom = true
      : this.padTop = true

    return location;
  },
  
  addTies : function(note) {
    if (this.state.tie) {
      var from = this.state.tie.vexNote;
      var to   = note.vexNote;
      var fromIndices = [];
      var toIndices   = [];
      _.each(from.getKeyProps(), function(fromKey, fromIndex) {
        _.find(to.getKeyProps(), function(toKey, toIndex) {
          if (fromKey.key === toKey.key
              && fromKey.octave === toKey.octave) {
            fromIndices.push(fromIndex);
            toIndices.push(toIndex);
            fromKey.startTie = true;
            toKey.endTie     = true;
          }
        });
      });

      if (fromIndices.length && toIndices.length) {
        this.state.tie.vexTie = new Vex.Flow.StaveTie({
          first_note      : from
          , last_note     : to
          , first_indices : fromIndices
          , last_indices  : toIndices
        });
        this.vex.drawables.push(this.state.tie.vexTie);
      }
      else {
        console.log('invalid tie', from, to);
      }
    }
  
    this.state.tie = note.tied ? note : false;

    return this;
  },

  clearTies : function() {
    if (this.state.tie) {
      console.log('could not tie', this.state.tie);
    }

    this.state.tie = false;

    return this;
  }
});
})(window.TrinketIO, window._, window.Vex);
