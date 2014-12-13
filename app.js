var fs = require('fs'),
    nconf = require('nconf'),
    express = require('express'),
    passport = require('passport'),
    util = require('util'),
    FacebookStrategy = require('passport-facebook').Strategy,
    morgan = require('morgan'),
    session = require('express-session'),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser"),
    methodOverride = require('method-override'),
    graph = require('fbgraph');

nconf.argv()
     .env()
     .file('application', 'conf/application.json')
     .file('reference', 'conf/reference.json');

var FACEBOOK_APP_ID = nconf.get("facebook:appId");
var FACEBOOK_APP_SECRET = nconf.get("facebook:appSecret");
var PORT = nconf.get("port");

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the FacebookStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://knowyourfriends.akrivos.com:" + PORT + "/api/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      graph.setAccessToken(accessToken);
      // To keep the example simple, the user's Facebook profile is returned to
      // represent the logged-in user. In a typical application, you would want
      // to associate the Facebook account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

var app = express();

// configure Express
app.use('/components', express.static(__dirname + '/components'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
// Initialize Passport! Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

// GET /
//  The main/home endpoint where show the default index page.
app.get('/', function(req, res) {
  res.render('pages/index', { user: req.user } );
});

// GET /about
app.get('/about', function(req, res) {
  res.render('pages/about', { user: req.user });
});

app.get('/api/friends', ensureAuthenticated, function(req, res) {
  rankMyFriends(function(fbres) {
    res.send(fbres);
  });
});

app.post('/api/friend/:id/post', function(req, res) {
  console.log(req.body)
  postOnFriendsWall(req.params.id, req.body, function(err, fbres) {
    res.send(fbres);
  });
});

// GET /api/auth/facebook
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in Facebook authentication will involve
//   redirecting the user to facebook.com. After authorization, Facebook will
//   redirect the user back to this application at /auth/facebook/callback
app.get('/api/auth/facebook', passport.authenticate('facebook',
  { scope: ['read_stream', 'publish_actions'] }));

// GET /api/auth/facebook/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/api/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  }
);

// GET /logout
//   Logs out and redirects you to home.
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// Start application
app.listen(PORT);

function getMyFriends(callback) {
  graph.get("/me/friends?fields=name,picture,link", function(err, fbres) {
    callback(err, fbres.data);
  });
}

function getMyFeed(limit, callback) {
  limit = limit || 50;
  graph.get("/me/feed?fields=comments,likes&limit=" + limit, function(err, fbres) {
    callback(err, fbres.data);
  });
}

function rankMyFriends(callback) {
  var rankings = {};
  getMyFeed(1000, function(err, feed) {
    if (feed) {
      feed.forEach(function(item) {
        // process likes
        if (item.likes) {
          item.likes.data.forEach(function(from) {
            rankings[from.id] = (rankings[from.id] + 1) || 1;
          });
        }
        // process comments
        if (item.comments) {
          item.comments.data.forEach(function(comment) {
            rankings[comment.from.id] = (rankings[comment.from.id] + 1) || 1;
          });
        }
      });
      getMyFriends(function(err, friends) {
        var rankedFriends = [];
        friends.forEach(function(friend) {
          friend.rank = rankings[friend.id] || 0;
          rankedFriends.push(friend);
        });
        rankedFriends.sort(function(x, y) { return y.rank - x.rank; });
        callback(rankedFriends);
      });
    }
  });
}

function postOnFriendsWall(id, message, callback) {
  graph.post('/' + id + '/feed', message, function(err, res) {
    callback(err, res);
  });
}

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected. If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, 401 will be returned.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.status(401).send({
    "error": {
      "code": "NotLoggedIn",
      "message": "Could not detect a login session from Facebook."
    }
  });
}
