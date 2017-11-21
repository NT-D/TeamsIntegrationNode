var restify = require('restify');
var builder = require('botbuilder');
var notifyteams = require('./notifyteams');
var teams = require("botbuilder-teams");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new teams.TeamsChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

//Set body parser for restify
server.use(restify.plugins.bodyParser(
    {mapParams:true}
));

// Listen for messages from users 
server.post('/api/messages', connector.listen());
server.post('/api/notifyteams',notifyteams.notify);

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.send(": %s", session.message.text);
});

bot.dialog('selectChannel',[
    //Fetch channel list and shows them as button to select channel
    function(session){
        var teamId = session.message.sourceEvent.team.id;
        connector.fetchChannelList(session.message.address.serviceUrl, teamId, function (err, result) {
            if (err) {
                session.endDialog('There is some error. Try later');
            }
            else {
                var channels = {};
                result.forEach(function(channelInfo){
                    if(!channelInfo.name){
                        channels['General'] = {
                            id: channelInfo.id,
                            name: 'General'
                        };
                    }
                    else{
                        channels[channelInfo.name]={
                            id:channelInfo.id,
                            name: channelInfo.name
                        };
                    }
                });
                session.userData.channels = channels;
                builder.Prompts.choice(session,"WHich channel do you want to use?",channels,{listStyle:3});
            }
        });
    },
    //After selected channel, we'll send information to app.
    function(session,results)
    {
        if(results.response){
            var channels = session.userData.channels;
            var selectedOption = channels[results.response.entity];

            //fetch member list
            var conversationId = session.message.address.conversation.id;
            var adminUserInfo;
            connector.fetchMembers(session.message.address.serviceUrl, conversationId, function (err, result) {
                if (err) {
                    session.endDialog('There is some error. Try later');            
                }
                else {
                    result.forEach(function(user){
                        if(user.id === session.message.user.id){
                            adminUserInfo = user;
                            // break;
                        }
                    });
                }
                session.send("Hello "+adminUserInfo.givenName + adminUserInfo.surname +"(upn: "+ adminUserInfo.userPrincipalName+")")
                session.endDialog("You selected "+selectedOption.name +" channel (Id: "+selectedOption.id+"");
            });
        }
        else{
            session.send("Oops. Please try later");
        }
    }
]).triggerAction({
    matches:/.*select.*/i,
})