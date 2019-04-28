# Prepaid card slack bot

Monitor the funds and other resources related to my prepaid SIM card
account managed by Plus operator.

## Installation

1. Install yarn dependencies

```
yarn install
```

2. Install [puppeteer](https://github.com/GoogleChrome/puppeteer) OS dependencies.
They are listed in `apt-packages` in this repo as well.

3. Set all the env variables from `lib/config.js` file and start the server

```
yarn start
```

## How it works

It's a regular scrapper, but to log in to the admin area we need not only
a login/password but also a one-time password sent by SMS. The flow is following:

1. Bot sends a request via Slack on a scheduled basis
2. Once the request is approved, starts the headless Chrome and try to log in
3. Meanwhile opens a Slack dialog waiting for a session password
4. User receives the session password over SMS and types in the Slack dialog
5. Headless Chrome uses the password and proceeds with the account checks.

## Dependencies

 - https://github.com/F4-Group/dokku-apt
