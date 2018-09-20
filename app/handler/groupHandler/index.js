const { EVENT_TYPE } = require('../../data/messagingAPI/eventType')
const joinHandler = require('./joinHandler')
const messageHandler = require('./messageHandler')
const postbackHandler = require('./postbackHandler')

module.exports = (event) => {
  const eventType = event.type;
  switch (eventType) {
    case EVENT_TYPE.MESSAGE:
      return messageHandler(event)
    case EVENT_TYPE.JOIN:
      return joinHandler(event)
    case EVENT_TYPE.POSTBACK:
      return postbackHandler(event)
  }
}