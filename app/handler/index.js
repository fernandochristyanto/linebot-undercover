const { MESSAGE_SOURCE_TYPE } = require('../data/messagingAPI/messageSourceType')
const groupHandler = require('./groupHandler')

module.exports = (event) => {
  const source = event.message.source;
  switch (source) {
    case MESSAGE_SOURCE_TYPE.GROUP:
      return groupHandler(event);
  }
}