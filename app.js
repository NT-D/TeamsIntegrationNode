var restify = require('restify');
var builder = require('botbuilder');
var notifyteams = require('./notifyteams');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD

});

// Listen for messages from users 
server.post('/api/messages', connector.listen());
server.post('/api/notifyteams',notifyteams.notify);

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    console.log(session.message.address);
    session.send("You said: %s", session.message.text);
});
