var slackbot = require('./lib/bot');
var http = require('http');
var express = require('express');
var app = express();
var dotenv = require('dotenv');

app.configure(function () {

 // Request body parsing middleware should be above methodOverride
  app.use(express.bodyParser());
  app.use(express.urlencoded());
  app.use(express.json());

  app.use(app.router);
});

dotenv.load();


var config = {
    server: 'irc.freenode.com',
    nick: 'slackbot',
    username: 'slackbot',
    token: process.env.SLACK_TOKEN,
    channel: '#auth0test',
    users: {
        'ElGonto': 'gonto'
    }
};

var slackbot = new slackbot.Bot(config);
slackbot.listen();

app.post('/slack-message', function(req, res) {
  console.log("Message received");
  var text = req.body.text;
  slackbot.post(req.body.user_name, text);
  res.send(200);
});

var port = process.env.PORT || 3000;

http.createServer(app).listen(port, function (err) {
  console.log('listening in http://localhost:' + port);
});


