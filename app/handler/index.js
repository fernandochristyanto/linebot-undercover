const { MESSAGE_SOURCE_TYPE } = require('../data/messagingAPI/messageSourceType')
const groupHandler = require('./groupHandler')
const userHandler = require('./userHandler')

module.exports = (event) => {
  const source = event.source.type;
  switch (source) {
    case MESSAGE_SOURCE_TYPE.GROUP:
      return groupHandler(event);
    case MESSAGE_SOURCE_TYPE.USER:
      return userHandler(event);
  }
}