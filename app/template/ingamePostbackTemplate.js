exports.ingamePostbackTemplate = (currentUserName, currOrder) => {
  return {
    type: 'template',
    altText: 'Deskripsikan kalimat',
    template: {
      type: 'buttons',
      actions: [
        {
          type: 'postback',
          label: 'Berikut',
          data: `order=${currOrder}&ingame=true`
        }
      ],
      title: currentUserName,
      text: 'Deskripsikan kalimat yang didapat'
    }
  }
}

