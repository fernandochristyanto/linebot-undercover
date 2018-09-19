require('dotenv').config()

const config = {
  channelAccessToken: process.env.CHANNEL_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
  mongodbUri: process.env.MONGODB_URI
}

module.exports = config;