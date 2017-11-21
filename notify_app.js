var restify = require('restify');
var builder = require('botbuilder');
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url); 
});

// setup bot credentials
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);

// send simple notification
function sendProactiveMessage(address) {
    var msg = new builder.Message().address(address);
    var session = msg.session;
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
        msg.attachments([
            new builder.HeroCard(session)
                .title("Classic White T-Shirt")
                .subtitle("100% Soft and Luxurious Cotton")
                .text("Price is $25 and carried in sizes (S, M, L, and XL)")
                .images([builder.CardImage.create(session, 'http://petersapparel.parseapp.com/img/whiteshirt.png')])
                .buttons([
                    builder.CardAction.imBack(session, "buy classic white t-shirt", "Buy")
                ]),
            new builder.HeroCard(session)
                .title("Classic Gray T-Shirt")
                .subtitle("100% Soft and Luxurious Cotton")
                .text("Price is $25 and carried in sizes (S, M, L, and XL)")
                .images([builder.CardImage.create(session, 'http://petersapparel.parseapp.com/img/grayshirt.png')])
                .buttons([
                    builder.CardAction.imBack(session, "buy classic gray t-shirt", "Buy")            
                ])
        ]);
    bot.send(msg);
}

server.post('/api/messages', connector.listen());

// Do GET this endpoint to delivey a notification
server.get('/api/CustomWebApi', (req, res, next) => {
    var targetAddress = {
        channelId: 'msteams',
        conversation: 
         { isGroup: true,
           id:  process.env.TEAMS_CHANNEL_ID},
        serviceUrl: 'https://smba.trafficmanager.net/amer-client-ss.msg/' }  

    sendProactiveMessage(targetAddress);
    res.send('triggered');
    next();
  }
);

// root dialog
bot.dialog('/', function(session, args) {
});