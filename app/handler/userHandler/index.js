const { EVENT_TYPE } = require('../../data/messagingAPI/eventType')
const postbackHandler = require('./postbackHandler')
const messageHandler = require('./messageHandler')

module.exports = (event) => {
  const eventType = event.type;
  switch (eventType) {
    case EVENT_TYPE.POSTBACK:
      return postbackHandler(event)
    case EVENT_TYPE.MESSAGE:
      return messageHandler(event) //Untuk whiteguy (ketika mau kalah)
  }
}