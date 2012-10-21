var channelList = [];
var socket = null;
var currentChannel = null;

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
	str += '<form method="post" action="/quit" id="exitform"><input type="submit" value="Quit" /></form>';

	for(i in list) {
		str += '<div id="tabs-'+i+'"><div id="messages'+i+'" class="messages"></div></div>';
	}

	str += '<div id="input"><input type="text" id="inputelement" /></div>';

	str += '</div>';

	$('#channels').html(str);

	$('#inputelement').keydown(function(event) {
		if (event.which == 13) {
			event.preventDefault();
			var msg = $('#inputelement').val();
			mylog('should send message ' + msg);
			if (socket !== null) {
				socket.emit('msg', {
					'nick': window.nickName,
					'id': window.sessionId,
					'message': msg,
					'channel': window.currentChannel
					}
				);
			}
			setTimeout(function() {$('#inputelement').val('')}, 100);
		}
	});

	$('#tabs').tabs({selected: 0, show: function(event, ui) {
		scroll(ui.index);
        currentChannel = channelList[ui.index];
        mylog('changed to channel: ' + currentChannel);

        $('#inputelement').focus();

	}});
}

function doPage()
{
	socket = io.connect();

	socket.on('message', function(msg) {
		mylog('we got a message');
		if(msg.channels != null) {
			mylog('with channels');
			channelList = msg.channels;
			createChannels(msg.channels);
			updateAll(msg.msgs);
		} else {
			mylog('with msg');
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