const express = require('express')
const http = require('http')
const config = require('./lib/config')
const {RemoteInputService} = require('./remote_input_service')
const { go } = require('./lib/browser/session')

const remoteInput = new RemoteInputService();

(async () => {
  const app = express()

  app.use('/slack/actions', remoteInput.slackInteractions.expressMiddleware())
  app.use('/public', express.static('public'))

  http.createServer(app).listen(config.server.port, () => {
    console.log(`server listening on port ${config.server.port}`)

    go({remoteInput})
  })
})()
