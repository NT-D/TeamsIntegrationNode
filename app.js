var restify = require('restify');
var builder = require('botbuilder');
var teams = require("botbuilder-teams");
var request = require('request');
var azure = require('botbuilder-azure');
var notifyteams = require('./notifyteams');
var mockapp = require('./mockapp');
var settings = require('./setting');

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
server.post('/api/mock',mockapp.savedata);//For test purpose for this project

//Setup state storage with Azure
var docDbClient = new azure.DocumentDbClient(settings.documentDbOptions);
var cosmosStorage = new azure.AzureBotStorage({ gzipData: false }, docDbClient);

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.send(": %s", session.message.text);
}).set('storage', cosmosStorage);//Set Cosmos DB as state storage

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
                builder.Prompts.choice(session,"Which channel do you want to use?",channels,{listStyle:3});
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

                //Compose data for sending app
                var requestData = {
                    "tenant_id":session.message.sourceEvent.tenant.id,
                    "team_id":session.message.sourceEvent.team.id,
                    "channel_id":selectedOption.id,
                    "bot_service_url":session.message.address.serviceUrl,
                    "admin_upn":adminUserInfo.userPrincipalName,
                };

                //Make request options
                const options = {
                    url: process.env.API_ENDPOINT,
                    method: "POST",
                    json: requestData
                }

                //Send information for users
                request(options,function(error,response,body){
                    if(!error && response.statusCode == 200){
                        session.send("I sent information to app correctrly :)");
                        session.send("Hello "+adminUserInfo.givenName + adminUserInfo.surname +"(upn: "+ adminUserInfo.userPrincipalName+")")
                        session.endDialog("You selected "+selectedOption.name +" channel (Id: "+selectedOption.id+"");
                    }
                    else{
                        session.endDialog("Oops. can't send information correctry to app.. Please try later");
                    }
                });

            });
        }
        else{
            session.send("Oops. can't fetch members from Microsoft Teams, please try later");
        }
    }
]).triggerAction({
    matches:/.*select.*/i,
})

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id == message.address.bot.id) {
                // Welcome function is here.
                var reply = new builder.Message()
                        .address(message.address)
                        .text("Hello! If you want to change the notify channel (default: General), Please type *select* to me!");
                bot.send(reply);
            }
        });
    }
    else if (message.membersRemoved) {
        var botId = message.address.bot.id;
        for (var i = 0; i < message.membersRemoved.length; i++) {
            if (message.membersRemoved[i].id === botId) {
                // Good bye function is here. Because bot is already removed, bot cannot talk
                console.log("good bye");
                break;
            }
        }
    }
});