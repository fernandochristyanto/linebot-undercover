const db = require('../../model')
const client = require('../../client')
const { MESSAGE_TYPE } = require('../../data/messagingAPI/messageType')

const COMMAND = {
  JOIN: "join",
  LEAVE: "leave",
  LIST: "list",
  TUTORIAL: "tutorial",
  START: "start"
}

module.exports = async (event) => {
  const message = event.message.text;

  switch (message) {
    case COMMAND.JOIN:
      return await handleJoin(event)
    case COMMAND.LEAVE:
      return await handleLeave(event)
    case COMMAND.START:
      break;
    case COMMAND.LIST:
      return await handleList(event)
    case COMMAND.TUTORIAL:
      return handleTutorial(event)
  }
}

function handleTutorial() {
  const text = `
  UndercoverBOT adalah bot yang membantu user-user di sebuah group dalam bermain undercover.\n\n
  Apa itu undercover?\n
  Undercover adalah permainan dimana rolenya terdiri dari : whiteguy, undercover1, undercover2, dan sisanya member.\nSetiap user akan diacak dan dibagikan role. Selain role, setiap user juga akan dibagikan kalimat.\Whiteguy, undercover1 dan undercover2 juga akan diberikan kalimat, akan tetapi bukanlah kalimat yang sama dengan kalimat yang diberikan pada para member, melainkan kalimat yang menyerupai kalimat yang diberikan ke para member.\n\nSetiap putarannya, semua user akan secara bergantian mendeskripsikan kalimat yang didapat.\n\nGoalnya untuk para member adalah mengidentifikasi para undercover dan whiteguy.\n\nGoal dari undercover adalah tetap mendeskripsikan kalimatnya sedemikian mungkin agar tidak ketahuan oleh para member bahwa dirinya adalah undercover.\n\nGoal dari whiteguy adalah menebak kalimat yang diberikan ke para member.\nPada akhir tiap putarannya, seluruh user akan diminta untuk vote salah 1 user. User dengan vote terbanyak akan di eliminasi dari permainan\n\n
  Kondisi Menang: \n
  - Member menang apabila, berhasil mengeliminasi seluruh undercover dan whiteguy\n
  - Undercover menang apabila setiap member dan whiteguy telah ter eliminasi\n
  - Whiteguy menang apabila berhasil menebak kalimat yang dimiliki oleh member

  \n\n\n
  List perintah undercoverBOT:\n
  - join\n
  Bergabung ke permainan\n\n
  - leave\n
  Keluar dari permainan\n\n
  - list\n
  Akan menampilkan seluruh user yang telah join\n\n
  - start\n
  Mulai permainan\n\n
  - tutorial\n
  Menampilkan tutorial permainan
  `

  return client.replyMessage(event.replyToken, {
    type: MESSAGE_TYPE.TEXT,
    text: text
  })
}

async function handleList(event) {
  const groupLineId = event.source.groupId;
  let group = await db.TrGroup.findOne({ lineId: groupLineId });
  if (group) {
    const groupMembers = await db.TrGroupMember.find({ groupId: group.id })
    let joinedMembersList = 'List user yang telah bergabung ke permainan:\n'
    groupMembers.forEach(groupMember => {
      joinedMembersList += `- ${groupMember.fullName}\n`
    })
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: joinedMembersList
    })
  }
  else {
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: "Belum ada user yang bergabung ke permainan."
    })
  }
}

async function handleLeave(event) {
  const groupLineId = event.source.groupId;
  const userLineId = event.source.userId;

  let group = await db.TrGroup.findOne({ lineId: groupLineId });
  if (!group) {
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: "User belum bergabung ke permainan."
    })
  }
  else {
    let insertedMember = await db.TrGroupMember.findOne({ groupId: group.id, lineId: userLineId })
    if (insertedMember) {
      group.groupMembers.remove(insertedMember.id)
      await group.save()
      await insertedMember.remove();
      return client.replyMessage(event.replyToken, {
        type: MESSAGE_TYPE.TEXT,
        text: "Sukses keluar dari permainan."
      })
    }
    else {
      return client.replyMessage(event.replyToken, {
        type: MESSAGE_TYPE.TEXT,
        text: "User belum bergabung ke permainan."
      })
    }
  }
}

async function handleJoin(event) {
  const groupLineId = event.source.groupId;
  const userLineId = event.source.userId;

  let group = await db.TrGroup.findOne({ lineId: groupLineId });
  if (!group) {
    group = await db.TrGroup.create({
      lineId: groupLineId
    })
  }

  // Insert member
  let insertedMember = await db.TrGroupMember.findOne({ groupId: group.id, lineId: userLineId })
  if (insertedMember) {
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: "User telah bergabung ke permainan."
    })
  }
  else {
    // Check is user friend with bot
    client.pushMessage(event.source.userId, {
      type: MESSAGE_TYPE.TEXT,
      text: "Anda telah sukses tergabung dalam permainan undercover."
    })
      .then(async () => {
        const user = await client.getProfile(event.source.userId)
        insertedMember = await db.TrGroupMember.create({
          groupId: group.id,
          fullName: user.displayName,
          lineId: user.userId
        })
        group.groupMembers.push(insertedMember)
        await group.save()
      })
      .catch(err => {
        client.replyMessage(event.replyToken, {
          type: MESSAGE_TYPE.TEXT,
          text: "Anda harus berteman dengan bot untuk dapat join."
        })
      })
  }
}