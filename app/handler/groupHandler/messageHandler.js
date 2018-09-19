const db = require('../../model')
const client = require('../../client')
const { MESSAGE_TYPE } = require('../../data/messagingAPI/messageType')
const { getRandomWordPair } = require('../../service/trWordPair')
const { ROLE } = require('../../data/role')
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
      return await start(event)
    case COMMAND.LIST:
      return await handleList(event)
    case COMMAND.TUTORIAL:
      return handleTutorial(event)
  }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

async function assignRolesToGroupMembers(groupId) {
  const groupMembers = await db.TrGroupMember.find({ groupId: groupId })
  const { correctWord, anotherWord } = await getRandomWordPair();
  let integerArray = new Array
  for (let i = 0; i < groupMembers; i++) {
    integerArray.push(i)
  }

  // Assign ordering to users
  integerArray = shuffle(integerArray)
  for (let i = 0; i < groupMembers.length; i++) {
    groupMembers[i].order = integerArray[i]
    await groupMembers[i].save()
  }

  // Get whiteguy, and undercover random indexes
  let randomIndex = Math.floor(Math.random() * integerArray.length)
  const whiteGuyIndex = integerArray[randomIndex]
  integerArray = integerArray.filter(int => int !== whiteGuyIndex)
  randomIndex = Math.floor(Math.random() * integerArray.length)
  const undercoverOneIndex = integerArray[randomIndex]
  integerArray = integerArray.filter(int => int !== undercoverOneIndex)
  randomIndex = Math.floor(Math.random() * integerArray.length)
  const undercoverTwoIndex = integerArray[randomIndex]

  // Assign roles to users
  for (let index = 0; index < groupMembers.length; index++) {
    if (index === whiteGuyIndex) {
      groupMember[index].role = ROLE.WHITEGUY
    }
    else if (index === undercoverOneIndex || index === undercoverTwoIndex) {
      groupMember[index].role = ROLE.UNDERCOVER
      groupMember[index].word = anotherWord
    }
    else {
      groupMember[index].role = ROLE.MEMBER
      groupMember[index].word = correctWord
    }
    await groupMember[index].save()
  }
}

async function broadcastRoleMessages(groupId) {
  const groupMembers = await db.TrGroupMember.find({ groupId: groupId })
  groupMembers.forEach(groupMember => {
    let pushMessageText = '';
    switch (groupMember.role) {
      case ROLE.WHITEGUY:
        pushMessageText = "Kamu adalah whiteguy!"
        break;
      case ROLE.UNDERCOVER:
        pushMessageText = `Kata : ${groupMember.word}`
        break;
      case ROLE.MEMBER:
        pushMessageText = `Kata : ${groupMember.word}`
        break;
    }

    client.pushMessage(groupMember.lineId, {
      type: MESSAGE_TYPE.TEXT,
      text: pushMessageText
    })
  })
}

async function start(event) {
  const groupLineId = event.source.groupId
  const group = await db.TrGroup.find({ lineId: groupLineId })
    .populate('groupMembers')
  const canGameStart = (group) => {
    console.log(JSON.stringify(group, undefined, 2))
    return group.groupMembers.length >= 4
  }

  // console.log(group)
  if (group && canGameStart(group)) {
    await assignRolesToGroupMembers(group.id)
    await broadcastRoleMessages(group.id)
  }
  else {
    return client.replyMessage(event.replyToken, {
      type: MESSAGE_TYPE.TEXT,
      text: "Jumlah orang untuk memulai game minimal 4 orang"
    })
  }
}

function handleTutorial(event) {
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