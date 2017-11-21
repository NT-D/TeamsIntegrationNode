var builder = require('botbuilder');

exports.notify = function(req,res,next){
    console.log("Notify Test!");

    //Create Bot Connector for sending notification
    var connector = new builder.ChatConnector({
        appId: process.env.MICROSOFT_APP_ID,
        appPassword: process.env.MICROSOFT_APP_PASSWORD
    });

    //Will use variables, but now I use specific channel information
    var address = {
        channelId:'msteams',
        user:{id:'<userid>'},
        bot:{id:'<botid>'},
        conversation:{id:'<conversationid>'},
        serviceUrl:'https://smba.trafficmanager.net/amer-client-ss.msg/'
    }
    
    var bot = new builder.UniversalBot(connector);
    var msg = new builder.Message().address(address);
    msg.text('Hello, this is a notification');
    msg.textLocale('en-US');
    bot.send(msg);

    res.send("test");
}