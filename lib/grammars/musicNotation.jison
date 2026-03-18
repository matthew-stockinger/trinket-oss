/* description: Parses trinket flavored lilypond streams. */

/* lexical grammar */
%lex
%%

/* [1-9]([b#])        return 'KEY' */
/* \d+\/\d+           return 'TIME' */
"dup"                 return 'DUPLET'
"trip"                return 'TRIPLET'
(\d+\.?|\.)           return 'DURATION'
_[^}\s~]+             return 'LABEL'
([\-#n])\1?           return 'ACCIDENTAL'
([A-G])\1{0,4}        return 'LOWNOTE'
[a-g]\'{0,5}          return 'HIGHNOTE'
[rs]                  return 'REST'
\<\s*                 return '<'
\s*\>                 return '>'
\{\s*                 return '{'
\s*\}                 return '}'
\s*\~                 return '~'
\s+                   return 'SEP'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%start stream

%% /* language grammar */

stream
  : entity
    {$$ = [$1];}
  | stream SEP entity
    {$$ = $1.concat($3);}
  | stream EOF
    {return $1;}
  ;

entity
  : note
    {$$ = $1;}
  | rest
    {$$ = $1;}
  | tuplet
    {$$ = $1;}
  ;

pitch
  : LOWNOTE
    {$$ = {type:'note', name:$1.charAt(0).toLowerCase(), octave:4 - $1.substr(1).length};}
  | HIGHNOTE
    {$$ = {type:'note', name:$1.charAt(0).toLowerCase(), octave:5 + $1.substr(1).length};}
  | pitch ACCIDENTAL
    {$1.accidental = $2.replace(/\-/g, 'b'); $$ = $1;}
  ;

pitches
  : pitches SEP pitch
    {$1.push($3); $$ = $1;}
  | pitch
    {$$ = [$1];}
  ;

chord
  : '<' pitches '>'
    {$$ = {type:'chord', notes:$2};}
  ;

note
  : pitch
    {$$ = $1;}
  | chord
    {$$ = $1;}
  | note DURATION
    {$1.duration = $2; $$ = $1;}
  | note LABEL
    {$1.label = $2.substr(1); $$ = $1;}
  | note '~'
    {$1.tied = true; $$ = $1;}
  ;

rest
  : REST
    {$$ = {type:$1 === 'r' ? 'rest' : 'spacer'};}
  | rest DURATION
    {$1.duration = $2; $$ = $1;}
  ;

tuplet
  : DUPLET '{' note SEP note '}'
    {$$ = {type: 'tuplet', beats:3, notes:[$3,$5]};}
  | TRIPLET '{' note SEP note SEP note '}'
    {$$ = {type: 'tuplet', beats:2, notes:[$3,$5,$7]};}
  ;