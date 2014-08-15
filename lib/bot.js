var IRC = require('irc');
var slack = require('./slacker');
var _ = require('lodash');

/**
 * IRC Bot for syncing messages from IRC to Slack
 * @param {object} config Bot configuration
 * - server: IRC server
 * - nick: Bot IRC nickname
 * - token: Slack token
 * - channels: List of IRC channels to watch
 * - users: Map of ~login: slack usernames
 */
var Bot = function (config) {
    this.config = config || {};

    this.client = new IRC.Client(
        this.config.server,
        this.config.nick || 'slackbot',
        {
            userName: this.config.username,
            channels: [this.config.channel]
        }
    );

    this.clients = {};
    var self = this;
    _.each(config.users, function(user) {
      self.clients[user] = new IRC.Client(
          self.config.server,
          user,
          {
              userName: user,
              channels: [self.config.channel]
          }
      );
    })


    this.slacker = new slack.Slacker({ token: this.config.token });
    this._handleErrors();
    return this;
};

/**
 * Whenever an error is provided catch is and let the channel know
 */
Bot.prototype._handleErrors = function () {
    var self = this;
    this.client.addListener('error', function (message) {
        console.log(message);
    });
};

/**
 * Attempt to give a user op controls
 */
Bot.prototype.giveOps = function (channel, nick) {
    this.client.send('MODE', channel, '+o', nick);
};

Bot.prototype.post = function (user, text) {
  var userClient = this.clients[user];
  if (userClient) {
    userClient.say(this.config.channel, text);
    return true;
  } else {
    return false;
  }
}

/**
 * Handle post and pass it to slack
 */
Bot.prototype.listen = function () {
    var self = this;
    // Handle public user post
    this.client.addListener('message', function (from, to, message) {
        var fromUser = _.find(self.config.users, function(user) {
          return from.indexOf(user) >= 0;
        })
        if (!fromUser) {
          self.slacker.send('chat.postMessage', {
              channel: '#irc',
              text: message,
              username: from,
              parse: 'full',
              link_names: 1,
              unfurl_links: 1
          });
        }
    });
};

exports = module.exports.Bot = Bot;
