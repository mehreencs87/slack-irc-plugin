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
    channel: '#auth0',
    users: ['gonto', 'eugeniop', 'cristiandouce', 'pose']
};

var slackbot = new slackbot.Bot(config);
slackbot.listen();

app.post('/slack-message', function(req, res) {
  if (req.body.user_name !== config.nick && req.body.user_name !== config.username)  {
    var text = req.body.text;
    var sent = slackbot.post(req.body.user_name, text);
    if (sent) {
      res.send(200);
    } else {
      res.send(200, {
        text: "You cannot send messages to IRC until your name is mapped in the config"
      });
    }
  } else {
    res.send(200);
  }

});

var port = process.env.PORT || 3000;

http.createServer(app).listen(port, function (err) {
  console.log('listening in http://localhost:' + port);
});


