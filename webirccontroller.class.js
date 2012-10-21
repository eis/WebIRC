require('Socket.IO');

var settings = require('./settings');
var IRCServerConnection = require('./ircserverconnection.class');


function WebIRCController(io) {

	// private
	var internal = {
			MAX_MSGS: 1000,
			ircMessages: [],
			webClients: {},
			ircServerConnections: {},
			sessionNickMapping: {},
			debugMessageHandler: function(msg) {}
	};

	function messageHandler(data) {
		debug("Got a message from irc with " + data.clientId + " from " + data.channel);

		for (i in settings.IRC_CHANNELS) {
			if (data.channel == settings.IRC_CHANNELS[i]) {
				internal.ircMessages.push(data);


				if (internal.webClients[data.clientId]) {
					internal.webClients[data.clientId].json.send(data);
					debug("Data sent to " + data.clientId);
				} else {
					debug("WARN: could not find client connection with id "
							+ data.clientId);
				}
			}
		}

		if (internal.ircMessages.length >= internal.MAX_MSGS) {
			internal.ircMessages = internal.ircMessages.splice(0,1);
		}
	};

	function debug(msg) {
		console.log(msg);
	}

	// constructor
	if (!io) {
		throw new Error("invalid object given to constructor");
	}

	io.sockets.on('connection', function(client) {

		client.emit('please identify');
		debug('Got a client connection, requesting identify');

		client.on('identify request', function(data) {
			// client.sessionId undefined at this point so cannot be the key
			internal.webClients[data.id] = client;
			debug("got a client identify request :: " + data.id + " :: " + data.nick);

			client.json.send({msgs:internal.ircMessages,channels: settings.IRC_CHANNELS});
		});

		client.on('disconnect', function() {
			for(i in internal.webClients) {
				if(internal.webClients[i].session == client.sessionId) {
					delete internal.webClients[i];
				}
			}
			debug("disconnect");
		});

		/**
		 * 	@param data.nick IRC nick used
		 *	@param data.id session id
		 *	@param data.message message sent
		 *	@param data.channel target IRC channel
		 */

		client.on('msg', function(data) {
			 internal.ircServerConnections[data.id].sendMessage(data.channel, data.message);
		});
	});

	// privileged

	this.onDebugMessage = function(handler) {
		internal.debugMessageHandler = handler;
	};

	this.quit = function(sessionId) {
		if (internal.ircServerConnections[sessionId] !== undefined) {
			internal.ircServerConnections[sessionId].quit('Client exit');
		}
	}

	this.newConnection = function(nickName, sessionId) {
		var serverConnection = new IRCServerConnection(settings.IRC_SERVER, nickName, settings.IRC_CHANNELS);
		serverConnection.onMessage(messageHandler);
		serverConnection.onDebugMessage(internal.debugMessageHandler);
		serverConnection.setClientConnectionId(sessionId);

		internal.ircServerConnections[sessionId] = serverConnection;

		internal.sessionNickMapping[sessionId] = nickName;

		return true;
	};

	this.resolveNickForSession = function(sessionId) {
		return internal.sessionNickMapping[sessionId];
	};

}
module.exports = WebIRCController;