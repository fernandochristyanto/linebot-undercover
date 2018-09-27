const db = require('../model')

exports.getUnEliminatedMembers = async (groupId) => {
  return await db.TrGroupMember.find({ groupId: groupId, $or: [{ eliminated: false }, { eliminated: undefined }] })
}

exports.clearGroupMemberVote = async (groupId) => {
  return await db.TrGroupMember.find({ group: groupId }).update({ voted: false, voteUserId: undefined })
}