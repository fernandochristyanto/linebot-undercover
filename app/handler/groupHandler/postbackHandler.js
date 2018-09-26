const { extractObjectFromPostbackData } = require('../../service/data')
const db = require('../../model')
const client = require('../../client')
const { ingamePostbackTemplate } = require('../../template/ingamePostbackTemplate')
const { MESSAGE_TYPE } = require('../../data/messagingAPI/messageType')
const { getVoteBtnTemplate } = require('../../template/voteBtnTemplate')

module.exports = async (event) => {
  const postbackData = event.postback.data
  const data = extractObjectFromPostbackData(postbackData)

  console.log(JSON.stringify(data, undefined, 2))

  if (data.ingame) {
    return await ingamePostbackHandler(event, data)
  }
}

async function ingamePostbackHandler(event, data) {
  const prevOrder = parseInt(data.order)
  const currentOrder = prevOrder + 1

  const group = await db.TrGroup.findOne({ lineId: event.source.groupId })
  const groupMembers = await db.TrGroupMember.find({ groupId: group.id, $or: [{ eliminated: false }, { eliminated: undefined }] })

  // Check is postback sender correct (order)
  if (group.currentOrder != prevOrder)
    return null;

  const hasTurnEnded = await (async () => {
    if (groupMembers.length - 1 == prevOrder)
      return true
    return false
  })();

  const isVoteSessionNow = await (async () => {
    if (groupMembers.length == group.currentOrder)
      return true
    return false
  })();

  if (isVoteSessionNow) {
    // Send to group, members has to vote 
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: "Putaran telah selesai... Voting sedang berlangsung."
    })
  }
  else {
    group.currentOrder = currentOrder;
    if (hasTurnEnded) {
      // Begin voting
      client.replyMessage(event.replyToken, {
        type: MESSAGE_TYPE.TEXT,
        text: "Putaran telah selesai... Memulai voting."
      })

      // Broadcast ke members
      for (let i = 0; i < groupMembers.length; i++) {
        let groupMember = groupMembers[i]
        client.pushMessage(groupMember.lineId, mapGroupMembersToVoteBtn(groupMembers, group.lineId, groupMember.lineId))
      }
      await group.save();
    }
    else {
      // Send ingame postback
      const currentUser = await db.TrGroupMember.findOne({ groupId: group.id, orderNumber: currentOrder })
      await group.save();
      return client.replyMessage(event.replyToken, ingamePostbackTemplate(currentUser.fullName, currentOrder))
    }
  }
}

function mapGroupMembersToVoteBtn(groupMembers, groupLineId, currentUserLineId) {
  let voteBtns = new Array()
  groupMembers.forEach((groupMember) => {
    if (groupMember.lineId !== currentUserLineId)
      voteBtns.push(getVoteBtnTemplate(groupMember.fullName, groupLineId, groupMember.lineId, currentUserLineId))
  })

  return voteBtns;
}