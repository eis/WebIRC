var express = require('express');
var app = express.createServer(),
		io = require('Socket.IO').listen(app);

require('jade');

var WebIRCController = require('./webirccontroller.class');
var settings = require('./settings');

var WebIRC = new WebIRCController(io);

function debug(msg) { console.log(msg); };

WebIRC.onDebugMessage(debug);

// up the log level to not show heartbeat messages
io.set('log level', 2);

// details: https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
app.configure(function() {
	// this is required for BODY request param support
	// bodyParser() with express 2.x, bodyDecoder() with earlier versions
	app.use(express.bodyParser());

	// to know which client belongs to which irc connection, we use sessions
	// cookieparser must be defined before session as per
	// http://senchalabs.github.com/connect/middleware-session.html
	app.use(express.cookieParser());
	app.use(express.session({ secret: "some value" }));

	debug("Socket: configured and ready");
});

app.set('view engine', 'jade');
app.set('view options', {
	    layout: false
});

app.get('/', function(req, res) {
	res.render('index');
});

app.post('/login', function(req, res){

	if (!req.session || !req.session.id) {
		res.render('index');
		return;
	}

	var hasLoginInfo = (req.body.user !== undefined);
	var sessionIdString = req.session.id;
	var nickName = undefined;

	if (hasLoginInfo) {
		nickName = req.body.user.name;
		WebIRC.newConnection(nickName, sessionIdString);
		debug("Setting client connection id to " + sessionIdString);
		res.redirect('/irc');
	} else {
		res.redirect('/index');
	}

});

app.get('/irc', function(req, res) {
	var sessionIdString = req.session.id;
    if (!sessionIdString) {
		res.redirect('/index');
		return;
    }
	nickName = WebIRC.resolveNickForSession(sessionIdString);

	res.render('chat', {
	     locals: {
		 	nick: nickName,
		 	sessionId: sessionIdString
	     }
	});
});

app.post('/quit', function(req, res) {
	WebIRC.quit(req.session.id);
	res.redirect('/');
});

app.get('/*.*', function(req, res) {
	res.sendfile("./static" + req.url);
});

app.listen(settings.LOCAL_SERVER_PORT);

console.log("Listening at " + settings.LOCAL_SERVER_PORT);
