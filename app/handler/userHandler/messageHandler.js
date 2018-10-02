const { extractObjectFromPostbackData } = require('../../service/data')
const db = require('../../model')
const client = require('../../client')
const { ingamePostbackTemplate } = require('../../template/ingamePostbackTemplate')
const { MESSAGE_TYPE } = require('../../data/messagingAPI/messageType')
const { getVoteBtnTemplate } = require('../../template/voteBtnTemplate')
const { getUnEliminatedMembers, clearGroupMemberVote } = require('../../service/trGroupMember')
const { removeGroupAndMember } = require('../../service/trGroup')
const { ROLE } = require('../../data/role')

module.exports = async (event) => {
  const userLineId = event.source.userId
  const user = await db.TrGroupMember.findOne({ lineId: userLineId })

  const isUserWhiteguy = (user) => user.role == ROLE.WHITEGUY
  const canWhiteGuyGuess = (whiteguy) => whiteguy.eliminationGuess || whiteguy.finalTwoGuess

  if (isUserWhiteguy(user)) {
    if (canWhiteGuyGuess(user)) {
      const guess = event.message.text
      const group = await db.TrGroup.findById(user.groupId)
      if (guess.toLowerCase() === group.correctWord.toLowerCase()) {
        // Tebakan benar
        client.pushMessage(group.lineId, {
          type: MESSAGE_TYPE.TEXT,
          text: "Tebakan whiteguy benar, game telah berakhir dimenangkan oleh whiteguy."
        })

        await removeGroupAndMember(user.groupId)
      }
      else {
        // Tebakan salah
        user.eliminated = true
        await user.save()
        if (user.eliminationGuess) {
          await clearGroupMemberVote(group.id)
          group.currentOrder = 0;
          group.groupMembers.remove(user.id)
          await group.save()
          const currentUser = await db.TrGroupMember.findOne({ groupId: group.id, $or: [{ eliminated: false }, { eliminated: undefined }], orderNumber: 0 });
          client.pushMessage(group.lineId, ingamePostbackTemplate(currentUser.fullName, 0))
        }
        else if (user.finalTwoGuess) {
          const remainingUser = await db.TrGroupMember.findOne({ groupId: group.id })
          client.pushMessage(group.lineId, {
            type: MESSAGE_TYPE.TEXT,
            text: `Tebakan whiteguy salah, ${remainingUser.role} memenangkan game`
          })

          await removeGroupAndMember(user.groupId)
        }
      }
    }
  }
}