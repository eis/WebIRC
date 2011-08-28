var express = require('express');
var app = express.createServer(),
		io = require('Socket.IO').listen(app);

require('jade');

var settings = require('./settings');
var IRCServer = require('./ircserver.class');

// up the log level to not show heartbeat messages
io.set('log level', 2);

// details: https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
app.configure(function() {
	// this is required for BODY request param support
	// bodyParser() with express 2.x, bodyDecoder() with earlier versions
	app.use(express.bodyParser());
	console.log("Socket: configured and ready");
});

var opts = {
	server: settings.IRC_SERVER,
	channels: settings.IRC_CHANNELS,
	maxMsgs: 1000
};

var MyWebIRC = {};
MyWebIRC.ircMessages = [];
MyWebIRC.webClients = [];

function messageHandler(data) {

	for (i in opts.channels) {
		if (chan == opts.channels[i]) {
			MyWebIRC.ircMessages.push(data);

			if (MyWebIRC.webClients.length != 0) {
				for (i in MyWebIRC.webClients) {
					MyWebIRC.webClients[i].client.json.send(data);
				}
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
	MyWebIRC.webClients.push({session:client.sessionId,client:client});
	console.log("got a client :: " + client.sessionId + " :: "+MyWebIRC.webClients.length);

	client.json.send({msgs:MyWebIRC.ircMessages,channels: opts.channels});

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
		var server = new IRCServer(settings.IRC_SERVER, nickName, settings.IRC_CHANNELS);
		server.onMessage(messageHandler);
		server.onDebugMessage(debugMessageHandler);
		res.render('chat', {
		     locals: {
			 	nick: nickName
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
