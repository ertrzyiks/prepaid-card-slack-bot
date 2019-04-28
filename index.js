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

  http.createServer(app).listen(config.server.port, async () => {
    console.log(`server listening on port ${config.server.port}`)

    for (let i = 0; i < 3; i++) {
      const res = await go({remoteInput})
      if (res) break
    }

    cron.schedule('30 16 * * *', async () => {
      for (let i = 0; i < 3; i++) {
        const res = await go({remoteInput})
        if (res) break
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Warsaw'
    })

    // Clean up public folder
    cron.schedule('0 0 * * *', () => {
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
