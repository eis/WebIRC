var express = require('express');
var app = express.createServer(),
		io = require('Socket.IO').listen(app);

require('jade');

var settings = require('./settings');
var IRCServerConnection = require('./ircserverconnection.class');

// up the log level to not show heartbeat messages
io.set('log level', 2);

// details: https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
app.configure(function() {
	// this is required for BODY request param support
	// bodyParser() with express 2.x, bodyDecoder() with earlier versions
	app.use(express.bodyParser());

	// to know which client belongs to which irc connection, we use sessions
	// cookieparser must be deined before session as per 
	// http://senchalabs.github.com/connect/middleware-session.html
	app.use(express.cookieParser());
	app.use(express.session({ secret: "some value" }));
	
	console.log("Socket: configured and ready");
});

var opts = {
	server: settings.IRC_SERVER,
	channels: settings.IRC_CHANNELS,
	maxMsgs: 1000
};

var MyWebIRC = {};
MyWebIRC.ircMessages = [];
MyWebIRC.webClients = {};

function messageHandler(data) {

	for (i in opts.channels) {
		if (chan == opts.channels[i]) {
			MyWebIRC.ircMessages.push(data);
			
			console.log("Got a message from irc with " + data.clientId);

			if (MyWebIRC.webClients[data.clientId]) {
				MyWebIRC.webClients[data.clientId].json.send(data);
				console.log("Data sent to " + data.clientId);
			} else {
				console.log("WARN: could not find client connection with id "
						+ data.clientId + " from " + MyWebIRC.webClients.length + " clients");
			}
		}
	}

	if (MyWebIRC.ircMessages.length >= opts.maxMsgs) {
		MyWebIRC.ircMessages = MyWebIRC.ircMessages.splice(0,1);
	}
};


function debugMessageHandler(msg) {
	console.log(msg);
}

io.sockets.on('connection', function(client) {
	
	client.emit('please identify');
	console.log('Got a client connection, requesting identify');
	
	client.on('identify request', function(data) {
		// client.sessionId undefined at this point so cannot be the key
		MyWebIRC.webClients[data.id] = client;
		console.log("got a client identify request :: " + data.id + " :: " + data.nick);
	
		client.json.send({msgs:MyWebIRC.ircMessages,channels: opts.channels});
	});

	client.on('disconnect', function() {
		for(i in MyWebIRC.webClients) {
			if(MyWebIRC.webClients[i].session == client.sessionId) {
				MyWebIRC.webClients.splice(i,1);
			}
		}
		console.log("disconnect");
	});
});

app.set('view engine', 'jade');
app.set('view options', {
	    layout: false
});

app.get('/', function(req, res) {
	res.render('index');
});

app.post('/irc', function(req, res){

	var hasLoginInfo = (req.body.user !== undefined);

	if (hasLoginInfo) {
		var nickName = req.body.user.name;
		var serverConnection = new IRCServerConnection(settings.IRC_SERVER, nickName, settings.IRC_CHANNELS);
		serverConnection.onMessage(messageHandler);
		serverConnection.onDebugMessage(debugMessageHandler);
		serverConnection.setClientConnectionId(req.session.id);
		console.log("Setting client connection id to " + req.session.id);
		res.render('chat', {
		     locals: {
			 	nick: nickName,
			 	sessionId: req.session.id
		     }
		  });
	} else {

		res.render('chat', {
		     locals: {
			 	nick: '???'
		     }
		  });
	}
});

app.get('/*.*', function(req, res) {
	res.sendfile("./static" + req.url);
});

app.listen(settings.LOCAL_SERVER_PORT);

console.log("Listening at " + settings.LOCAL_SERVER_PORT);
