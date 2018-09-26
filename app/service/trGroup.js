const db = require('../model')

exports.setAllMemberVoteStatus = async (groupLineId, hasVoted) => {
  const group = await db.TrGroup.findOne({ lineId: groupLineId })
  if (group) {
    const groupMembers = await db.TrGroupMember.find({ groupId: group.id })
    for (let i = 0; i < groupMembers.length; i++) {
      groupMembers[i].voted = hasVoted;
      await groupMembers[i].save()
    }
    return groupMembers
  }
}

exports.setMemberVoteStatus = async (groupLineId, memberLineId, hasVoted) => {
  const group = await db.TrGroup.findOne({ lineId: groupLineId })
  if (group) {
    const groupMember = await db.TrGroupMember.findOne({ groupId: group.id, lineId: memberLineId })
    if (groupMember) {
      groupMember.voted = hasVoted;
      await groupMember.save()
      return groupMember
    }
  }
}

exports.removeUneliminatedOrderNumberGap = async (groupId) => {
  let groupMembers = await db.TrGroupMember.find({ groupId: groupId, $or: [{ eliminated: false }, { eliminated: undefined }] }).sort({ order: 'ascending' })

  for (let i = 0; i < groupMembers.length; i++) {
    groupMembers[i].orderNumber = i
    await groupMembers[i].save()
  }
}