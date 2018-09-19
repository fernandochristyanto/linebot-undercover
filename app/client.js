const line = require('@line/bot-sdk')
const config = require('../config');

new line.Client(config);
line.middleware(config);

const client = new line.Client(config);

module.exports = client;