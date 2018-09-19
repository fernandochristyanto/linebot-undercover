const mongoose = require('mongoose');
const config = require('./../../config')
mongoose.set('debug', true);
mongoose.Promise = Promise;
mongoose.connect(config.mongodbUri || "mongodb://localhost:27017/linebot-linguist", {
  keepAlive: true,
  useNewUrlParser: true
});

module.exports = {
  
}