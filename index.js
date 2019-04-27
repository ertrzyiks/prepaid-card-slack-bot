const config = require('./lib/config')
const {RemoteInputService} = require('./remote_input_service')
const { go } = require('./lib/browser/session')

const remoteInput = new RemoteInputService();

(async () => {
  const server = await remoteInput.startServer({
    port: config.server.port
  })

  console.log(`Listening for events on ${server.address().port}`)

  go({remoteInput})
})()
