var cookieParser = require('cookie-parser');
var session = require("express-session");
var passport = require('passport');
var bodyParser = require("body-parser");
var LocalStrategy = require('passport-local').Strategy;
var db = require('../models/schema');
var authenticationMiddleware = require('./authMiddleware');
passport.authenticationMiddleware = authenticationMiddleware;
module.exports = function(app) {
    app.use(session({ secret: "admin", resave: true, saveUninitialized: true}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(cookieParser());
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });
    
    passport.deserializeUser(function(id, done) {
        db.profiles.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy(
        function(username, password, done) {
          db.profiles.findOne({ username: username }, function (err, user) {
            if (err) {
              return done(err); 
            }
            if (!user) {
              return done(null, false, { message: 'Incorrect username.' });
            }
            if (password != user.password) {
              return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
          });
        }
      ));
}



