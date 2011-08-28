var channelList = [];

function update(msg) 
{
	for(i in channelList) {
		if(channelList[i] == msg.channel)
			$("#messages"+i).append("&lt;"+msg.from+"&gt; "+scanMsg(msg.msg)+"<br/>");
		
		scroll(i);
	}
	
}

function updateAll(list)
{
	for(i in list) {
		for(j in channelList) {
			if(channelList[j] == list[i].channel)
				$("#messages"+j).append("&lt;"+list[i].from+"&gt; "+scanMsg(list[i].msg)+"<br/>");
		}
	}

	for(i in channelList)
		scroll(i);
}

function scanMsg(msg) 
{
	var regex = /\b(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)[-A-Z0-9+&@#\/%=~_|$?!:,.]*[A-Z0-9+&@#\/%=~_|$]/i;

	return msg.replace(regex," <a href=\"$&\" target=\"_blank\">$&</a> ");
}

function scroll(i) 
{
	$("#messages"+i).scrollTop(9999999);
}

function createChannels(list) 
{
	str = '<div id="tabs"><ul>';

	for(i in list) {
		str += '<li><a href="#tabs-'+i+'">'+list[i]+'</a></li>';
	}

	str += '</ul>';

	for(i in list) {
		str += '<div id="tabs-'+i+'"><div id="messages'+i+'" class="messages"></div></div>';
	}

	str += '</div>';

	$('body').append(str);

	$('#tabs').tabs({selected: 0, show: function() {
		for(i in channelList) 
			scroll(i);
	}});
}

function doPage() 
{
	socket = io.connect();
	
	socket.on('message', function(msg) {
		if(msg.channels != null) {
			channelList = msg.channels;				
			createChannels(msg.channels);
			updateAll(msg.msgs);
		} else {
			update(msg);
		}
	});
	
	socket.on('please identify', function() {
		var sessionID = window.sessionId;
		mylog('identify request received, responding with ' + sessionID);
		socket.emit('identify request',
				{nick: window.nickName, id: sessionID}
		);
	});
}

$(document).ready(function() {
	if("WebSocket" in window) {
		if (window.loggedIn === true) {
			$.getScript('/socket.io/socket.io.js', function() {
				doPage();
			});
		 }
	} else {
		window.location = "error.html";
	}

});

function mylog(msg) {
	if (window.console && console.log) {
		console.log(new Date + ': ' + msg);
	}
}