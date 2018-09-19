const db = require('../../model')
const client = require('../../client')
const { MESSAGE_TYPE } = require('../../data/messagingAPI/messageType')

const COMMAND = {
  JOIN: "join",
  LEAVE: "leave",
  LIST: "list",
  TUTORIAL: "tutorial",
  START: "start"
}

module.exports = async (event) => {
  const message = event.message.text;

  switch (message) {
    case COMMAND.JOIN:
      return await handleJoin(event)
    case COMMAND.LEAVE:
      return await handleLeave(event)
    case COMMAND.START:
      break;
  }
}

async function handleList(event) {
  const groupLineId = event.source.groupId;
  let group = await db.TrGroup.findOne({ lineId: groupLineId });
  if (group) {
    const groupMembers = await db.TrGroupMember.find({ groupId: group.id })
    let joinedMembersList = 'List user yang telah bergabung ke permainan:\n'
    groupMembers.forEach(groupMember => {
      joinedMembersList += `- ${groupMember.fullName}\n`
    })
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: joinedMembersList
    })
  }
  else {
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: "Belum ada user yang bergabung ke permainan."
    })
  }
}

async function handleLeave(event) {
  const groupLineId = event.source.groupId;
  const userLineId = event.source.userId;

  let group = await db.TrGroup.findOne({ lineId: groupLineId });
  if (!group) {
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: "User belum bergabung ke permainan."
    })
  }
  else {
    let insertedMember = await db.TrGroupMember.findOne({ groupId: group.id, lineId: userLineId })
    if (insertedMember) {
      group.groupMembers.remove(insertedMember.id)
      await group.save()
      await insertedMember.remove();
      return client.replyMessage(event.replyToken, {
        type: MESSAGE_TYPE.TEXT,
        text: "Sukses keluar dari permainan."
      })
    }
    else {
      return client.replyMessage(event.replyToken, {
        type: MESSAGE_TYPE.TEXT,
        text: "User belum bergabung ke permainan."
      })
    }
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
        const user = await client.getProfile(event.source.userId)
        insertedMember = await db.TrGroupMember.create({
          groupId: group.id,
          fullName: user.displayName,
          lineId: user.userId
        })
        group.groupMembers.push(insertedMember)
        await group.save()
      })
      .catch(err => {
        client.replyMessage(event.replyToken, {
          type: MESSAGE_TYPE.TEXT,
          text: "Anda harus berteman dengan bot untuk dapat join."
        })
      })
  }
}