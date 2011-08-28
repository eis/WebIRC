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
	    server: new irc({ server: serverParam, nick: nickParam })
	};
	
	//internal.server = new irc({ 'server': internal.serverName, 'nick': internal.nickName });
    
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

    	var data = {channel: chan, from:nick, msg:message};

    	debugMessage("IRC: " + msg.params[0] + " - " + msg.person.nick + ":" + msg.params[1]);

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
    
    this.onMessage = function(handlerFunc) {
    	internal.IRCMessageHandler = handlerFunc;
    };
    
    this.onDebugMessage = function(handlerFunc) {
    	internal.DebugMessageHandler = handlerFunc;
    };
}
module.exports = IRCServerConnection;