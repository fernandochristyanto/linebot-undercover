const { extractObjectFromPostbackData } = require('../../service/data')
const db = require('../../model')
const client = require('../../client')
const { ingamePostbackTemplate } = require('../../template/ingamePostbackTemplate')
const { MESSAGE_TYPE } = require('../../data/messagingAPI/messageType')
const { getVoteBtnTemplate } = require('../../template/voteBtnTemplate')
const { getUnEliminatedMembers, clearGroupMemberVote } = require('../../service/trGroupMember')
const { removeUneliminatedOrderNumberGap } = require('../../service/trGroup')
const { ROLE } = require('../../data/role')

module.exports = async (event) => {
  const postbackData = event.postback.data
  const data = extractObjectFromPostbackData(postbackData)

  console.log(JSON.stringify(data, undefined, 2))
  if (data.vote) {
    return await votePostbackHandler(event, data)
  }
}

async function votePostbackHandler(event, data) {
  // TODO: update current member's voteUserId
  // TODO: update current member's voted = true
  // TODO: get all group members who has voted, and show list
  // TODO: see if all group members have voted

  const { groupLineId, votedUserLineId, userLineId } = data;
  const group = await db.TrGroup.findOne({ lineId: groupLineId })
  const member = await db.TrGroupMember.findOne({ groupId: group.id, lineId: userLineId })
  const votedMember = await db.TrGroupMember.findOne({ groupId: group.id, lineId: votedUserLineId })
  const isVoteSessionNow = await (async (group) => {
    if (group.groupMembers.length == group.currentOrder)
      return true
    return false
  })(group);

  if (isVoteSessionNow) {
    if (!member.voted) {
      member.voteUserId = votedMember.id
      member.voted = true
      await member.save()
      client.replyMessage(event.replyToken, {
        type: MESSAGE_TYPE.TEXT,
        text: `Sukses melakukan vote terhadap ${votedMember.fullName}.`
      })
      return await memberHasVoted(event, group);
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
    /**
     * Ada yg belum voting
     * Reply ke grup : 
     * Member yang telah melakukan voting: 
     *  - member1
     *  - member2
     */
    
    const groupLineId = group.lineId;
    const replyText = mapVotedMembersToReplyText(votedGroupMembers)
    client.pushMessage(groupLineId, {
      type: MESSAGE_TYPE.TEXT,
      text: replyText
    })
  }
  else {
    return await toNextTurn(event, group)
  }
}

async function toNextTurn(event, group) {
  const groupMembers = await getUnEliminatedMembers(group.id)
  const getMostVotedMemberId = () => {
    members = {}
    groupMembers.forEach(groupMember => {
      if (members[groupMember.voteUserId] == undefined) {
        members[groupMember.voteUserId] = 1
      }
      else {
        members[groupMember.voteUserId] = members[groupMember.voteUserId] + 1;
      }
    })

    console.log("getMostVotedMemberId (members {} : )", JSON.stringify(members, undefined, 2))

    let currentTopCount = 0;
    let mostVotedMembers = new Array()
    Object.keys(members).forEach((key) => {
      if (members[key] == currentTopCount) {
        mostVotedMembers.push(key)
      }
      else if (members[key] > currentTopCount) {
        currentTopCount = members[key]
        mostVotedMembers = new Array()
        mostVotedMembers.push(key)
      }
    })

    console.log("getMostVotedMemberId (mostVotedMembers [] : )", JSON.stringify(mostVotedMembers, undefined, 2))

    return mostVotedMembers;
  }

  const votedMembers = getMostVotedMemberId()
  if (votedMembers.length > 0) {
    if (votedMembers.length == 1) {
      // set as eliminated
      const eliminateMember = await db.TrGroupMember.findById(votedMembers[0])
      eliminateMember.eliminated = true;
      await eliminateMember.save()
      await removeUneliminatedOrderNumberGap(group.id)
      client.pushMessage(group.lineId, {
        type: MESSAGE_TYPE.TEXT,
        text: `${eliminateMember.fullName} telah di eliminasi berdasarkan vote. Role: ${eliminateMember.role}.`
      })
      if (eliminateMember.role == ROLE.WHITEGUY) {
        client.pushMessage(eliminateMember.lineId, {
          type: MESSAGE_TYPE.TEXT,
          text: "Whiteguy akan di eliminasi berdasar vote. Silahkan ketik kalimat sesungguhnya. Apabila benar, maka whiteguy secara otomatis menang."
        })
        eliminateMember.eliminationGuess = true
        await eliminateMember.save()
      }
      else {
        await clearGroupMemberVote(group.id)
        group.groupMembers.remove(eliminateMember.id)
        group.currentOrder = 0 //resets group current order (for ingame)
        await group.save()
        await controlHasGameEnded(event, group)
      }
    }
    else {
      client.pushMessage(group.lineId, {
        type: MESSAGE_TYPE.TEXT,
        text: `Terdapat lebih dari 1 member dengan jumlah vote yang sama, tidak ada member yang ter-eliminasi di putaran ini.`
      })
      await controlHasGameEnded(event, group)
    }
    await clearGroupMemberVote(group.id)
  }
}

async function controlHasGameEnded(event, group) {
  const unEliminatedMembers = await getUnEliminatedMembers(group.id)
  if (unEliminatedMembers.count <= 2) {
    const whiteGuyArr = unEliminatedMembers.filter(member => member.role == ROLE.WHITEGUY)
    if (whiteGuyArr.length > 0) {
      // Masih ada whiteguy
      client.pushMessage(whiteGuyArr[0].lineId, {
        type: MESSAGE_TYPE.TEXT,
        text: "Tersisa 2 pemain, whiteguy silahkan menebak kalimat yang benar. Apabila tebakan benar, maka whiteguy otomatis menang."
      })
      whiteGuyArr[0].finalTwoGuess = true
      await whiteGuyArr[0].save()
    }
    else {
      const underCoverArr = unEliminatedMembers.filter(member => member.role == ROLE.UNDERCOVER)
      if (underCoverArr.length == 2) {
        // Undercover win
        client.pushMessage(group.lineId, {
          type: MESSAGE_TYPE.TEXT,
          text: "Tersisa 2 undercover. Undercover menang!"
        })
      }
      else {
        // Draw
        client.pushMessage(group.lineId, {
          type: MESSAGE_TYPE.TEXT,
          text: "Tersisa 2 pemain. Permainan berakhir seri."
        })
      }
    }
  }
  else {
    const underCoverAndWhiteGuyArr = unEliminatedMembers.filter(member => member.role == ROLE.UNDERCOVER || member.role == ROLE.WHITEGUY)
    if (underCoverAndWhiteGuyArr.length == 0) {
      // Member win
      client.pushMessage(group.lineId, {
        type: MESSAGE_TYPE.TEXT,
        text: "Hanya member yang tersisa. Permainan selesai dimenangi oleh member!"
      })
    }
    else {
      // To next round
      const currentUser = await db.TrGroupMember.findOne({ groupId: group.id, orderNumber: 0 });
      client.pushMessage(group.lineId, ingamePostbackTemplate(currentUser.fullName, 0))
    }
  }
}

function mapVotedMembersToReplyText(votedGroupMembers) {
  let replyText = 'Member yang telah melakukan vote : \n'
  votedGroupMembers.forEach((groupMember) => {
    replyText += `- ${groupMember.fullName}\n`
  })
  return replyText;
}