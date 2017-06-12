/*-----------------------------------------------------------------------------
This template gets you started with a simple dialog that echoes back what the user said.
To learn more please visit
https://docs.botframework.com/en-us/node/builder/overview/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var azure = require('azure-storage');
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');
var msg;
var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

var tableSvc = azure.createTableService('botproactivef2c6cu','5+Jx8KhBcWhII4DLPyYIShow3vcr8Np0+IPXPgmrIU/SZeOUVHo4zroDwKAbZvfcsT5J7GjmRhuPjDeS95ECiQ==');
tableSvc.createTableIfNotExists('BPUserData', function(error, result, response){
  if(!error){
   
  }
});


//Beginning Dialog
bot.dialog('/', function (session) {var uname=session.message.address.user.name;session.send("Welcome! Bing Places shall now be connected to you on Messenger!");
if(uname=="BPtest Admin"){var task = 
                {
                PartitionKey: {'_':String(session.message.address.user.name)},
                RowKey: {'_': String(session.message.address.channelId)},
                phone: {'_':String('7259367260')},//instead, we need to get the phone  number and put it here somehow.
                businessid: {'_':String('BPREST235')},
                address:{'_':JSON.stringify(session.message.address)},
                dueDate: {'_':new Date(2015, 6, 20), '$':'Edm.DateTime'}
                };
                tableSvc.insertEntity('BPUserData',task, function (error, result, response) {
                if(!error){}
                });session.beginDialog('/bingconvo');}
else
session.beginDialog('/deciderconvo');});


//if the conversation is started by a Business Owner
bot.dialog('/deciderconvo',[
    function(session)
    {
        if(session.message.text=="hi"||session.message.text=="hey"||session.message.text=="hello"||session.message.text=="hie")//very first message
        {
           
                var task = 
                {
                PartitionKey: {'_':String(session.message.address.user.name)},
                
                RowKey: {'_': String(session.message.address.channelId)},
                phone: {'_':String('7259367260')},//instead, we need to get the phone  number and put it here somehow.
                //data regarding channel and emal id-
                //connector established content.
                
                businessid: {'_':String('BPREST235')},
                address:{'_':JSON.stringify(session.message.address)},
                dueDate: {'_':new Date(2015, 6, 20), '$':'Edm.DateTime'}
                };
                tableSvc.insertEntity('BPUserData',task, function (error, result, response) {
                if(!error){}
                });
           
        }
        else //if this is not the first time of conversation
        {
            if(session.message.text=="change")//convo initiated by business owner
            {session.replaceDialog('/changeconvo');}
            else//convo initiated by bingplaces
            {
            var query = new azure.TableQuery()
             .select(['phone'])
             .where('PartitionKey eq ?', session.message.address.user.name)
            tableSvc.queryEntities('BPUserData',query, null, function(error, result, response) {
            if(!error) 
            {
                builder.Prompts.text(session, "Is "+ JSON.stringify(result["entries"][0]["phone"]["_"]) +" your phone number??");
            }
            });
        }}
    },
    function (session, results) 
    {
    session.userData.correctness = results.response;
    if(session.userData.correctness=="yes")
    {
            session.send("Great!So we are updated!!");
            
            setTimeout(function(){ session.replaceDialog('/deciderconvo');},15000);
    }//now should ideally go in sleep for a while
    else {session.send("SO we need change!!");session.beginDialog('/actualconvo');} 
    }
]);
        
        
//Actual Conversation Dialog  
bot.dialog('/actualconvo',[function(session){
        
        builder.Prompts.number(session, "What is your phone number?");
        },
    function (session, results) {
            session.userData.phonenumb = results.response;
    
            var queuedMessage = { address: session.message.address, text: session.message.text };
            var savedAddress=session.message.address;
        // add message to queue-we should be retrieveing info from disk and asking.
            session.sendTyping();

            var task = {
              PartitionKey: {'_':String(session.message.address.user.name)},
              RowKey: {'_': String(session.message.address.channelId)},
              //proid:{'_':String()
              phone: {'_':session.message.text},
              businessid: {'_':String('BPREST235')},
              address: {'_':JSON.stringify(session.message.address)},
              dueDate: {'_':new Date(2015, 6, 20), '$':'Edm.DateTime'}
            };

            tableSvc.insertOrReplaceEntity('BPUserData',task, function (error, result, response) {
              if(!error){ }
              session.send('Your phonenumber (\'' + session.message.text + '\') has been updated');
              });
              
              var query = new azure.TableQuery()
         .select(['address'])
         .where('PartitionKey eq ?', 'BPtest Admin')
  
        tableSvc.queryEntities('BPUserData',query, null, function(error, result, response){
        if(!error) 
        {
        //session.send(JSON.stringify(result["entries"][0]["address"]["_"]));
        var adminadrs=JSON.parse(result["entries"][0]["address"]["_"]);
        var msg2 = new builder.Message()
       .text(session.message.address.user.name+' changed their phone number!!')
       .address(adminadrs);
        bot.send(msg2);
        }
        });

            setTimeout(function(){ session.replaceDialog('/deciderconvo');},15000);}
]);


//convo with admin for proactive messaging
bot.dialog('/bingconvo',[function(session){builder.Prompts.text(session,"Hey Admin! Whom do you wish to notify?");},//admin gives business  name/id. we map it to page admin and send the needed message.
    function(session,results){
        
        var query = new azure.TableQuery()
         .select(['address'])
         .where('PartitionKey eq ?', results.response)
  
        tableSvc.queryEntities('BPUserData',query, null, function(error, result, response){
        if(!error) 
        {
        //session.send(JSON.stringify(result["entries"][0]["address"]["_"]));
        var personadrs=JSON.parse(result["entries"][0]["address"]["_"]);
       // session.send(result["entries"][0]["address"]["_"]);
        
        
        
        var msg3 = new builder.Message()
       .text(' BINGPLACES NOTIFICATION!! You might need a change')
       .address(personadrs);
        bot.send(msg3);
    }
            session.send("Successfully Notified");
        });}]);
        
        
        
//changeof data instiated by business owner

bot.dialog('/changeconvo',[function(session){builder.Prompts.text(session,"What do you wish to change?");},
    function(session,results){
        session.send(results.response);
        session.replaceDialog('/actualconvo');
    }
        
        ]);
        
        
        
        
        
        
if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}


