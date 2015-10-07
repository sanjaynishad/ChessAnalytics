var fs = require('fs');
var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var hbs = require('express-hbs');
var socketio = require("socket.io");
var HookManager = require('./chessanalytics/lib/hook-manager');

var busboy = require('connect-busboy');

var env = process.env.NODE_ENV || 'default';
var config = require('config');

var app = express();

app.set('port', (process.env.PORT || 5000));


//configure database
require('./config/database')(app, mongoose);

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

//configure express app
app.use(favicon(__dirname + '/public/favicon.png'));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb',  extended: false }));
//app.use(express.bodyParser({limit: '50mb'}));
app.use(cookieParser('S3CRE7'));
app.use(flash());
app.use(session({ secret: 'S3CRE7-S3SSI0N', saveUninitialized: true, resave: true } ));
app.use(express.static(path.join(__dirname, 'public')));
//require('./config/passport')(app, passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(busboy()); 

//configure routes
var chessanalytics = require('./routes/chessanalytics');
var chess4life_passport = require('./routes/chess4life_passport.js');

app.use('/', chessanalytics);
app.use('/parsearena', require('./routes/parsearena'));
app.use('/test', require('./routes/test'));
app.use('/api', require('./routes/api'));
app.use('/chess4life-passport', chess4life_passport);

//launch app server
var server = require('http').createServer(app).listen(app.get('port'));

var io = socketio.listen(server);

//io.set('log level', nconf.get('socket_log_level'));
//io.set('browser client minification', true);
//io.set('transports', [nconf.get('transports')]);
io.sockets.on('connection', function(client){
	client.on('hook', function(hook) {
		HookManager.io_hook(hook, client);
	});
});

module.exports = app;

var util = require('util');
var ga_file = util.format('%s/views/ga.jade', __dirname);
fs.exists(ga_file, function(exists){
if(!exists){
 fs.writeFile(ga_file, '');
}
});

