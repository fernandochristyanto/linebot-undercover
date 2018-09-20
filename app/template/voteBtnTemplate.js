exports.getVoteBtnTemplate = (fullName, groupLineId, votedUserLineId, currentUserLineId) => {
  return {
    type: 'template',
    altText: 'Pilih member untuk vote',
    template: {
      type: 'buttons',
      actions: [
        {
          type: 'postback',
          label: 'Vote',
          text: 'Vote',
          data: `vote=true&groupLineId=${groupLineId}&votedUserLineId=${votedUserLineId}&userLineId=${currentUserLineId}`
        }
      ],
      title: fullName,
      text: 'Tekan vote untuk memilih'
    }
  }
}