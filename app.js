var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');

var app = express();

app.use(bodyParser.json({ type: 'text/plain' }));

app.post('/channel/:channel', function(req, res) {
  if (!req.body) {
    res.send('No body received');
  } else if (req.body.SubscribeURL) {
    subscribe(req.body, res, '#' + req.params.channel);
  } else if (req.body.Message) {
    message(req.body, res, '#' + req.params.channel);
  } else {
    res.send('Error. Wrong message');
  }
});

app.listen(process.env.PORT || 3000, function() {});

function subscribe(body, res, channel) {
  var subscribeUrl = body.SubscribeURL;

  https
    .get(subscribeUrl, function (result) {
      sendToSlack({ text: 'Subscribed to ' + body.TopicArn, channel: channel });
      return res.send('OK');
    })
    .on('error', function (e) {
      return res.send('Subscribe error');
    });
}

function message(body, res, channel) {
  var msg = { text: body.Message };
  try {
    // If message not just a simple text
    msg = JSON.parse(body.Message);
  } catch (ex) {
  }

  var slackMessage;
  if (msg.text) {
    slackMessage = { text: msg.text };
  } else {
    slackMessage = {
      icon: ':interrobang:',
      text: 'Wrong SNS message ```' + body.Message + '```'
    };
  }

  if (!slackMessage) {
    return res.send('No message');
  }

  slackMessage.channel = channel;

  sendToSlack(slackMessage);
  return res.send('Sent message succesfully');
}

var sendToSlack = function (message) {
  var options = {
    host: 'hooks.slack.com',
    port: 443,
    method: 'POST',
    path: '/services/' + process.env.SLACK_TOKEN,
    headers: {'Content-type': 'application/json'}
  };

  var req = https.request(options, function (res) {
    res.on('data', function (data) {}).setEncoding('utf8');
  });

  req.write(JSON.stringify({
    text: message.text,
    channel: message.channel
  }));
  req.end();
};
