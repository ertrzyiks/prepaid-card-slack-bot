const { Client } = require('./lib/slack/client')
const { askForCode, requestCode } = require('./lib/slack/communication')
const uuidv4 = require('uuid/v4')
const PubSub = require('pubsub-js')

class RemoteInputService {
  constructor() {
    this.slackInteractions = Client.getMessageAdapter()

    this.slackInteractions.action({ type: 'dialog_submission' }, (payload, _respond) => {
      const requestId = payload.callback_id
      const {code} = payload.submission

      PubSub.publish(`password.${requestId}`, code)
    });

    this.slackInteractions.action({ type: 'button' }, (payload, respond) => {
      const requestId = payload.actions[0].action_id

      setImmediate(() => {
        PubSub.publish(`button.${requestId}`, {triggerId: payload.trigger_id, requestId})
      })

      respond({ text: 'Browser session has started', replace_original: true})
    });
  }

  async askForCode({triggerId, requestId}) {
    await askForCode({triggerId, requestId})

    return new Promise(resolve => {
      PubSub.subscribe(`password.${requestId}`, (name, input) => {
        resolve(input)
      })
    })
  }

  async anyoneAround() {
    const requestId = `request-${uuidv4()}`

    await requestCode({requestId})

    return new Promise(resolve => {
      PubSub.subscribe(`button.${requestId}`, (name, {requestId, triggerId}) => {
        resolve({requestId, triggerId})
      })
    })
  }

  async startServer({port}) {
    return await this.slackInteractions.start(port);
  }
}

module.exports = {
  RemoteInputService
}
