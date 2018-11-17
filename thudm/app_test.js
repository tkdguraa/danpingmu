var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var cron = require('cron');
var config = require('./config_test.json');
var mongodb = require('./mongodb');
var indexRouter = require('./routes/index');

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Redis store
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var redisClient = require('./redis').redisClient(config);
var rsmq = require('./redis').rsmq(config);

// Admin session
app.use(session({
    store: new redisStore({client: redisClient}),
    saveUninitialized: false,
    resave: false,
    secret: config.SESSION_SECRET,
    cookie: { maxAge: 24*60*60*1000 } // Expires in 1 day
}));

// Redis client
app.set('redis', redisClient);

// Redis message queue
app.set('rsmq', rsmq);

// Wechat user info cache
app.set('cache', new Map());

// Flush user info every day at midnight
new cron.CronJob('0 0 0 * * *', function() {
    console.log('CRON> Flush cache');

    app.get('cache').clear();
}, null, true, 'Asia/Shanghai');

// Init index router
require('./routes/index').init(app);

// Connect to Mongodb
mongodb.init(config);

// FIXME: for test
let Room = require('./common/utils').Room;
redisClient.hget("generated_id", '1', (err, id) => {
    if (err) id = 0;
    console.log('tmp_generated_id: ', id);
    app.set('room_1', new Room(1, id));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
