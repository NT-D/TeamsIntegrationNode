var builder = require('botbuilder');

exports.notify = function(req,res,next){
    console.log("Notify Test!");
    console.log("Send notification to : "+ req.params.channelId);

    //Create Bot Connector for sending notification
    var connector = new builder.ChatConnector({
        appId: process.env.MICROSOFT_APP_ID,
        appPassword: process.env.MICROSOFT_APP_PASSWORD
    });

    //Make address for posting information
    var address = {
        channelId:'msteams',//We expect to use Microsoft Teams channel
        bot:{id:"28:"+process.env.MICROSOFT_APP_ID},
        conversation:{
            id:req.params.channel_id,
            isGroup:true
        },
        serviceUrl:req.params.bot_service_url
    }

    var bot = new builder.UniversalBot(connector);
    var msg = new builder.Message().address(address);
    msg.text(req.params.message);
    bot.send(msg);

    //reply response as Rest API.
    res.send("test");
}