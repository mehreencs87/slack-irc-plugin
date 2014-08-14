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
    this._usermap = {
        users: this.config.users || {},
        nicks: {}
    };

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
    _.forIn(config.users, function(slackUser, ircUser) {
      self.clients[slackUser] = new IRC.Client(
          self.config.server,
          ircUser,
          {
              userName: ircUser,
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
        var channel = message.args[1];
        var error_message = mapPronouns(message.args[2]);
        console.log(error_message);
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
  } else {
    this.client.say(this.config.channel, text);
  }
}

/**
 * Handle post and pass it to slack
 */
Bot.prototype.listen = function () {
    var self = this;
    // Handle public user post
    this.client.addListener('message', function (from, to, message) {
        self.slacker.send('chat.postMessage', {
            channel: '#irc',
            text: self.prepareMessage(message, self.config.users),
            username: self._usermap.nicks[from] || from,
            parse: 'full',
            link_names: 1,
            unfurl_links: 1
        });
    });
};

/**
 * Map users with whois to get ~loginname for stability
 * @param {string} message Message to replace IRC user with slack @user
 * @param {array} users User mapping
 * @return {string} Message with slack @users
 */
Bot.prototype.prepareMessage = function (message, users) {
    Object.keys(users).forEach(function (ircUser) {
        if (message.indexOf(ircUser) >= 0) {
            message = message.replace(new RegExp(name, 'g'), '@' + users[name]);
        }
    });
    return message;
};

/**
 * Try and map error commands (in third person) to first person
 * so the bot is more personal.
 */
var mapPronouns = function (error_message) {
    var map = {
        'you': 'i',
        'you\'re': 'i\'m',
    };
    error_message = error_message.split(' ').map(function (word) {
        return map[word.toLowerCase()] ? map[word.toLowerCase()] : word;
    }).join(' ');
    return error_message;
};

exports = module.exports.Bot = Bot;
