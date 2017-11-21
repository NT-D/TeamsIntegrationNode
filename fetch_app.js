var restify = require("restify");
var builder = require("botbuilder");
var teams = require("botbuilder-teams");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create Teams chat connector for communicating with the Bot Framework Service 
var connector = new teams.TeamsChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond with fetched data
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("The channel list and member list are as follows:");
    
    //fetch channel list
    var teamId = session.message.sourceEvent.team.id;
    connector.fetchChannelList(session.message.address.serviceUrl, teamId, function (err, result) {
        if (err) {
            session.endDialog('There is some error');
        }
        else {
            session.send('%s', JSON.stringify(result));
        }
    });

    //fetch member list
    var conversationId = session.message.address.conversation.id;
    connector.fetchMembers(session.message.address.serviceUrl, conversationId, function (err, result) {
        if (err) {
            session.endDialog('There is some error');
        }
        else {
            session.send('%s', JSON.stringify(result));
        }
    });
});