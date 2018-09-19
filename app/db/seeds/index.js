const db = require('../../model')

module.exports = async () => {
  const wordPairs = [
    ['Kuda', 'Sapi'],
    ['Gitar', 'Biola'],
    ['Jepang', 'Korea'],
    ['Balon', 'Gundu'],
    ['Apel', 'Leci'],
    ['Jeruk', 'Lemon'],
    ['Sungai', 'Danau'],
    ['Laut', 'Danau'],
    ['Gelas', 'Cangkir']
  ]

  let wordPairInsertPromises = []

  wordPairs.forEach(wordPair => {
    wordPairInsertPromises.push(db.TrWordPair.create({
      word1: wordPair[0],
      word2: wordPair[1]
    }))
  })

  Promise.all(wordPairInsertPromises)
    .then(res => res)
    .catch(err => err)
}