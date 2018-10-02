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
  const userLineId = event.source.userId
  const user = await db.TrGroupMember.findOne({ lineId: userLineId })

  const isUserWhiteguy = (user) => user.role == ROLE.WHITEGUY
  const canWhiteGuyGuess = (whiteguy) => whiteguy.eliminationGuess || whiteguy.finalTwoGuess

  if (isUserWhiteguy) {
    if (canWhiteGuyGuess) {
      const guess = event.message.text
      const group = await db.TrGroup.findOne({ id: user.groupId })
      if (guess.toLowerCase() === group.currentWord.toLowerCase()) {
        // Tebakan benar
        return client.pushMessage(group.lineId, {
          type: MESSAGE_TYPE.TEXT,
          text: "Tebakan whiteguy benar, game telah berakhir dimenangkan oleh whiteguy."
        })

        // TODO: end game
      }
      else {
        // Tebakan salah
        user.eliminated = true
        await user.save()
        if (user.eliminationGuess) {
          group.currentOrder = 0;
          await group.save()
          const currentUser = await db.TrGroupMember.findOne({ groupId: group.id, $or: [{ eliminated: false }, { eliminated: undefined }] });
          client.pushMessage(group.lineId, ingamePostbackTemplate(currentUser.fullName, 0))
        }
        else if (user.finalTwoGuess) {
          const remainingUser = await db.TrGroupMember.findOne({ groupId: group.id })
          client.pushMessage(group.lineId, {
            type: MESSAGE_TYPE.TEXT,
            text: `Tebakan whiteguy salah, ${remainingUser.role} memenangkan game`
          })

          // TODO: end game
        }
      }
    }
  }
}