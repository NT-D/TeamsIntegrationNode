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
    function(session){
        //Get team id
        var teamId = session.message.sourceEvent.team.id;
        //Fetch channel list
        connector.fetchChannelList(session.message.address.serviceUrl, teamId, function (err, result) {
            if (err) {
                session.endDialog('There is some error');
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
                //Will show channel list as button           
                builder.Prompts.choice(session,"WHich channel do you want to use?",channels,{listStyle:3});
            }
        });
    },
    function(session,results)
    {
        if(results.response){
            var channels = session.userData.channels;
            var selectedOption = channels[results.response.entity];
            session.endDialog("You selected "+selectedOption.name +" channel (Id: "+selectedOption.id+"");
        }
        else{
            session.send("Oops. Please try later");
        }
    }
]).triggerAction({
    matches:/.*select.*/i,
})