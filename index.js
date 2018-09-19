const express = require('express')
const app = express();
const line = require('@line/bot-sdk')
const handleEvent = require('./app/handler')
const config = require('./config')
const errorHandler = require('./app/handler/routeHandler/errorHandler')
const seed = require('./app/db/seeds/index')
const client = require('./app/client')
const db = require('./app/model')

app.post('/seed', async (req, res, next) => {
  await seed();
  return res.send(200)
})

app.post('/webhook', line.middleware(config), (req, res, next) => {
  console.log(JSON.stringify(req.body.events, undefined, 2));
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
});

app.get('/test', async (req, res) => {
  const group = await db.TrGroup.find({ lineId:  "C536c1e9294ffd7a0f0ff022d71177e72"})
  res.json(group).send()
})
app.use(errorHandler)

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})