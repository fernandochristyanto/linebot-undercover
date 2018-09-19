const client = require('../../client')
const { MESSAGE_TYPE } = require('../../data/messagingAPI/messageType')
const db = require('../../model')

module.exports = async (event) => {
  // On join, delete all group datas and give push message
  let group = await db.TrGroup.find({ lineId: event.source.groupId });
  if (group.length > 0) {
    group = group[0]
    await db.TrGroupMember.find({ groupId: group.id }).remove()
    await group.remove()
  }

  return client.replyMessage(event.replyToken, {
    type: MESSAGE_TYPE.TEXT,
    text: "Halo, Undercover bot adalah bot yang membantu permainan undercover menjadi lebih mudah.\n\nUntuk bergabung ke permainan, ketik join.\n\nUntuk membatalkan gabung permainan, ketik leave.\n\nUntuk memulai permainan, ketik start."
  })
}