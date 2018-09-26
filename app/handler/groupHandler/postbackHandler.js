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
  else if (data.vote) {
    return await votePostbackHandler(event, data)
  }
}

async function ingamePostbackHandler(event, data) {
  const prevOrder = parseInt(data.order)
  const currentOrder = prevOrder + 1

  const group = await db.TrGroup.findOne({ lineId: event.source.groupId })
  const groupMembers = await db.TrGroupMember.find({ groupId: group.id, eliminated: false })

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

async function votePostbackHandler(event, data) {
  // TODO: update current member's voteUserId
  // TODO: update current member's voted = true
  // TODO: get all group members who has voted, and show list
  // TODO: see if all group members have voted

  const { groupLineId, votedUserLineId, userLineId } = data;
  const group = await db.TrGroup.findOne({ lineId: groupLineId })
  const member = await db.TrGroupMember.findOne({ groupId: group.id, lineId, userLineId })
  const votedMember = await db.TrGroupMember.findOne({ groupId: group.id, lineId: votedUserLineId })
  const isVoteSessionNow = await (async (group) => {
    if (group.groupMembers.length == group.currentOrder)
      return true
    return false
  })(group);

  if (isVoteSessionNow) {
    if (!member.voted) {
      member.voteUserId = votedMember.id
      await member.save()
      return await memberHasVoted();
    }
    else {
      return client.replyMessage(event.replyToken, {
        type: MESSAGE_TYPE.TEXT,
        text: "Anda telah melakukan voting pada putaran ini."
      })
    }
  }
  else {
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: "Sekarang bukan waktunya untuk melakukan vote."
    })
  }
}

async function memberHasVoted(event, group) {
  const groupMembers = await db.TrGroupMember.find({ groupId: group.id })
  let votedGroupMembers = new Array()
  let notVotedGroupMembers = new Array()
  for (let i = 0; i < groupMembers.length; i++) {
    if (groupMembers[i].voted) {
      votedGroupMembers.push(groupMembers[i])
    }
    else {
      notVotedGroupMembers.push(groupMembers[i])
    }
  }

  if (notVotedGroupMembers.length > 0) {
    // Ada yg belum voting
    const groupLineId = group.lineId;
    const replyText = mapVotedMembersToReplyText(votedGroupMembers)
    client.pushMessage(groupLineId, {
      type: MESSAGE_TYPE.TEXT,
      text: replyText
    })
  }
  else {
    
  }
}

function mapVotedMembersToReplyText(votedGroupMembers) {
  let replyText = 'Member yang telah melakukan vote : '
  votedGroupMembers.forEach((groupMember) => {
    replyText += `- ${groupMember.fullName}\n`
  })
  return replyText;
}