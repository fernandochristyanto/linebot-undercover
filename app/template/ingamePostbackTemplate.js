exports.ingamePostbackTemplate = (currentUserName, currOrder) => {
  return {
    type: 'template',
    altText: 'this is a buttons template',
    template: {
      type: 'buttons',
      actions: [
        {
          type: 'postback',
          label: 'Berikut',
          text: 'Berikut',
          data: `curr=${currOrder}&ingame=true`
        }
      ],
      title: currentUserName,
      text: 'Deskripsikan kalimat yang didapat'
    }
  }
}

