const { Client } = require('./client')
const config = require('../config')

exports.askForCode = function askForCode({triggerId, requestId}) {
  return Client.get().dialog.open({trigger_id: triggerId, dialog: {
    "callback_id": requestId,
    "title": "Authentication request",
    "submit_label": "Confirm",
    "state": "Limo",
    "elements": [
      {
        "type": "text",
        "label": "SMS Code",
        "name": "code"
      }
    ]
  }})
}

exports.send = function send(text, options) {
  return Client.get().chat.postMessage({
    ...options,
    channel: config.slack.conversationId,
    text: text
  })
}

exports.requestCode = function requestCode({requestId}) {
  return Client.get().chat.postMessage({channel: config.slack.conversationId, text: 'Check phone funds', blocks: [
      {
        "type": "actions",
        "block_id": requestId,
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Start",
              "emoji": true
            },
            "value": "proceed"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Not now",
              "emoji": true
            },
            "value": "later"
          }
        ]
      }
    ]})
}
