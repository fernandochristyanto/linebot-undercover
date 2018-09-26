const { EVENT_TYPE } = require('../../data/messagingAPI/eventType')
const postbackHandler = require('./postbackHandler')

module.exports = (event) => {
  const eventType = event.type;
  switch (eventType) {
    case EVENT_TYPE.POSTBACK:
      return postbackHandler(event)
  }
}