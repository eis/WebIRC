# WebIRC

Interactive version: message sending, multiple connections and very basic authentication by eis

## General requirements
 -   [Node.js](http://nodejs.org/download/)
 -   npm (node.js packaging manager, usually installed with Node.js)
 -   For web browsers, web socket support is required

## Dependencies from npm
All dependencies and their versions are specified in package.json. Installation of dependencies should be done with

`$ npm install`

The dependencies currently are:

 -   [Express](http://expressjs.com/)
 -   [IRC-js](http://gf3.github.com/IRC-js/)
 -   [Socket.IO](http://socket.io/)
 -   [Jade](http://jade-lang.com/)

## Running
If you have installed the dependencies, running the application is a matter of

`$ node app.js`

## Other notes

During developing, having a local ircd server helps. For windows, a light weight implementation
is for example [beware ircd](http://ircd.bircd.org/).
