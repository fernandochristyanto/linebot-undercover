const { EVENT_TYPE } = require('../../data/messagingAPI/eventType')
const joinHandler = require('./joinHandler')
const messageHandler = require('./messageHandler')

module.exports = (event) => {
  const eventType = event.type;
  switch (eventType) {
    case EVENT_TYPE.MESSAGE:
      return messageHandler(event)
    case EVENT_TYPE.JOIN:
      return joinHandler(event)
  }
}