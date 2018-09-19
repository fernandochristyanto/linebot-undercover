const mongoose = require('mongoose');
const db = require('./index');

const trGroup = new mongoose.Schema({
  lineId: {
    type: String,
    required: true
  },
  started: {
    type: Boolean
  },
  correctWord: {
    type: String
  },
  groupMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrGroupMember'
  }]
}, {
    timestamps: true
  });

const TrGroup = mongoose.model('TrGroup', trGroup);

module.exports = TrGroup;