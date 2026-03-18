var LocalStrategy  = require('passport-local').Strategy
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
  , config         = require('config')
  , userUtil       = require('../util/user');

function configurePassport(Passport) {
  Passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  Passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      if (user && user.hasRole("disabled")) {
        done(null, false, { message: 'Account Disabled' });
      } else {
        done(err, user);
      }
    });
  });

  Passport.use(new LocalStrategy({ usernameField : 'email' }, function(username, password, done) {
    User.findByLogin(username, function(err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false, { message: 'Unknown user ' + username });
      }

      if (user.hasRole("disabled")) {
        return done(null, false, { message: 'Account Disabled' });
      }

      if (user.password == null || user.password.length === 0) {
        return done(null, false, { message: 'A password was not found for this account.' });
      }

      user.comparePassword(password, function(err, isMatch) {
        if (err) return done(err);
        if(isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid password' });
        }
      });
    });
  }));

  if (config.app.auth.google && config.app.auth.google.clientID) {
    Passport.use(new GoogleStrategy({
      clientID          : config.app.auth.google.clientID,
      clientSecret      : config.app.auth.google.clientSecret,
      callbackURL       : config.app.auth.google.callbackURL,
      passReqToCallback : true
    }, function(req, token, refreshToken, profile, done) {
      var email      = profile.emails[0].value,
          emailParts = email.split('@'),
          username   = userUtil.generate_username(email),
          updateUser = false,
          promises   = [];

      User.findByMultiple({ email : email, username : username, 'profiles.google.id' : profile.id }, function(err, user) {
        if (err) {
          return done(err);
        }

        var next = req.session.get('next');

        req.session.reset();
        if (next) {
          req.session.set('next', next);
        }
        req.session.set('loggedInWith', 'google');

        if (user) {
          req.session.flash('requested', user.username);
          if (!user.avatar) {
            updateUser = true;
            user.avatar = profile._json.picture;
          }
          if (!user.profiles) {
            user.profiles = {};
          }
          if (!user.profiles.google) {
            updateUser = true;
            user.profiles.google = {
              id    : profile.id,
              token : token
            };
          }

          if (updateUser) {
            promises.push(user.save());
          }
          else {
            promises.push(Promise.resolve());
          }

          return Promise.all(promises).then(function() {
            return done(null, user);
          });
        }
        else {
          user = new User();
          user.email = email;
          user.fullname = profile.displayName || emailParts[0];
          user.username = username;
          req.session.flash('requested', user.username);
          user.source   = 'google';
          user.avatar   = profile._json.picture;
          user.profiles = {
            google : {
              id    : profile.id,
              token : token
            }
          };

          user.save(function(err, newUser) {
              if (!next) {
                req.session.set('next', '/welcome');
              }
              req.session.set('grantDemoTrinkets', true);
              req.session.flash('userAccountCreated', JSON.stringify(opts));

              return done(err, newUser)
            });
        }
      });
    }));
  }
}

module.exports = {
  configure : configurePassport
};
