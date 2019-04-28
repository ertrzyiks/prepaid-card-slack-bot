module.exports = {
  server: {
    port: process.env.PORT || 3005
  },
  user: {
    login: process.env.USER_LOGIN,
    password: process.env.USER_PASSWORD
  },
  slack: {
    conversationId: 'U06A7M124',
    token: process.env.SLACK_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
  }
}
