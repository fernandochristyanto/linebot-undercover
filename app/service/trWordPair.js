const db = require('./../model')

exports.getRandomWordPair = async () => {
  const wordPairs = await db.TrWordPair.find({})
  const wordPair = wordPairs[Math.floor(Math.random() * wordPairs.length)]

  const randomPairIndex = Math.floor(Math.random() * 2) + 1;
  const correctWord = wordPair[`word${randomPairIndex}`]
  const anotherWord = randomPairIndex == 1 ? wordPair["word2"] : wordPair["word1"]
  return {
    correctWord,
    anotherWord
  }
}