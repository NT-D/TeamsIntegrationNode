var builder = require('botbuilder');

exports.notify = function(req,res,next){
    console.log("Notify Test!");

    //Create Bot Connector for sending notification
    var connector = new builder.ChatConnector({
        appId: process.env.MICROSOFT_APP_ID,
        appPassword: process.env.MICROSOFT_APP_PASSWORD
    });

    //Will use variables, but now I use specific channel information
    connector.send()
}