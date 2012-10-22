var irc = require('IRC-js');

/**
 * IRCServerConnection class.
 * Object-oriented javascript done in the manner described in http://javascript.crockford.com/private.html
 * See also Node.js events at http://venodesigns.net/2011/04/16/emitting-custom-events-in-node-js/
 * 
 * @param serverParam
 * @param nickParam
 * @param channelsParam
 * @returns {IRCServerConnection}
 */
function IRCServerConnection (serverParam, nickParam, channelsParam) {

	if (!serverParam || !nickParam || !channelsParam) {
		throw new Error("Constructor parameters must not be empty");
	}
	
	// private
	var internal = {
		IRCMessageHandler: function(data) {},
		debugMessageHandler: function(msg) {},
		serverName: serverParam,
	    nickName: nickParam,
	    channels: channelsParam,
	    clientConnectionId: undefined,
	    server: new irc({ server: serverParam, nick: nickParam })
	};

	internal.server.connect(function() {
    	setTimeout(function() {
    		for(i in internal.channels) {
    			internal.server.join(internal.channels[i]);
    		}
    	}, 2000);
    });

	internal.server.on('privmsg', function(msg) {
    	nick = msg.person.nick;
    	chan = msg.params[0];
    	message = msg.params[1];

    	var data = {channel: chan, from:nick, msg:message, clientId: internal.clientConnectionId};

    	debugMessage("IRC: " + data.channel + " - " + data.from+ ":" + data.msg + ":" + data.clientId);

    	receiveMessage(data);

    });

    function receiveMessage(message) {
    	internal.IRCMessageHandler(message);
    }

    function debugMessage(message) {
    	internal.DebugMessageHandler(message);
    }

    // privileged
    this.toString = function() {
    	return "IRCServer[serverName=" + internal.serverName + "]";
    };

    this.sendMessage = function(channel, message) {
    	// sending to IRC
    	internal.server.privmsg(channel, message);

		// sending to web client
    	var data = {'channel': channel, 'from': internal.nickName, 'msg': message, 'clientId': internal.clientConnectionId};
    	receiveMessage(data);
	}

	this.quit = function(msg) {
		internal.server.quit(msg);
	}

    this.onMessage = function(handlerFunc) {
    	internal.IRCMessageHandler = handlerFunc;
    };

    this.onDebugMessage = function(handlerFunc) {
    	internal.DebugMessageHandler = handlerFunc;
    };

    this.getClientConnectionId = function() {
    	return internal.clientConnectionId;
    };
    this.setClientConnectionId = function(idValue) {
    	internal.clientConnectionId = idValue;
    };

}
module.exports = IRCServerConnection;