const cron = require('node-cron')
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

    cron.schedule('30 16 * * *', () => {
      go({remoteInput})
    }, {
      scheduled: true,
      timezone: 'Europe/Warsaw'
    })

    // Clean up public folder
    cron.schedule('0 0 * * *', () => {
      console.log('Clean Up')
      const fs = require('fs')
      const path = require('path')
      const directory = 'public'

      fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
          });
        }
      })
    }, {
      scheduled: true,
      timezone: 'Europe/Warsaw'
    })
  })
})()
