const db = require('../../model')
const client = require('../../client')
const { MESSAGE_TYPE } = require('../../data/messagingAPI/messageType')

const COMMAND = {
  JOIN: "join",
  LEAVE: "leave",
  START: "start"
}

module.exports = async (event) => {
  const message = event.message.text;

  switch (message) {
    case COMMAND.JOIN:
      break;
    case COMMAND.LEAVE:
      break;
    case COMMAND.START:
      break;
  }
}

async function handleJoin(event) {
  const groupLineId = event.source.groupId;
  const userLineId = event.source.userId;

  let group = await db.TrGroup.findOne({ lineId: groupLineId });
  if (!group) {
    group = await db.TrGroup.create({
      lineId: groupLineId
    })
  }

  // Insert member
  let insertedMember = await db.TrGroupMember.findOne({ groupId: group.id, lineId: userLineId })
  if (insertedMember) {
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: "User telah bergabung ke permainan."
    })
  }
  else {
    // Check is user friend with bot
    client.pushMessage(event.source.userId, {
      type: MESSAGE_TYPE.TEXT,
      text: "Anda telah sukses tergabung dalam permainan undercover."
    })
    .then(async () => {
      const user = client.getProfile(event.source.userId)
      insertedMember = await db.TrGroupMember.create({
        groupId: group.id,
        fullName: 
        lineId
      })
    })
    .catch(err => {

    })
  }
}