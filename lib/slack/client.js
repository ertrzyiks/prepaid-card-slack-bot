const { WebClient } = require('@slack/web-api')
const { createMessageAdapter } = require('@slack/interactive-messages')

const config = require('../config')

class Client {
  static get() {
    this.client = this.client || new WebClient(config.slack.token)
    return this.client
  }

  static getMessageAdapter() {
    return createMessageAdapter(config.slack.signingSecret)
  }
}

module.exports = {
  Client
}
