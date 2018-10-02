const db = require('../model')
const ObjectId = require('mongodb').ObjectId;

exports.getUnEliminatedMembers = async (groupId) => {
  return await db.TrGroupMember.find({ groupId: groupId, $or: [{ eliminated: false }, { eliminated: undefined }] })
}

exports.clearGroupMemberVote = async (groupId) => {
  return await db.TrGroupMember.update({
    groupId: new ObjectId(groupId)
  }, {
      voted: false, voteUserId: undefined
    }, { multi: true })
  // return await db.TrGroupMember.find({ groupId: groupId }).update({ voted: false, voteUserId: undefined })
}
