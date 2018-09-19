const mongoose = require('mongoose');
const db = require('./index');

const trWordPair = new mongoose.Schema({
  word1: {
    type: String,
    required: true
  },
  word2: {
    type: String,
    required: true
  }
}, {
    timestamps: true
  });

const TrWordPair = mongoose.model('TrWordPair', trWordPair);

module.exports = TrWordPair;