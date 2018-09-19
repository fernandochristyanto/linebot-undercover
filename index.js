const express = require('express')
const app = express();
const line = require('@line/bot-sdk')
const handleEvent = require('./app/handler')
const config = require('./config')
const errorHandler = require('./app/handler/routeHandler/errorHandler')
const seed = require('./app/db/seeds/index')
const client = require('./app/client')

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

app.get('/push', (req, res) => {
  client.pushMessage("U36ea69af08b3f29926b9ff278fa8678c", {
    type: 'text',
    text: "Test aja"
  })
  .then(() => {
    res.status(200).send()
  })
  .catch(err => {
    res.status(400).send()
  })
})

app.get('/profile', (req, res) => {
  client.getProfile("Uc9fe578e7246aa873201b820bc7ae16f")
  .then(profile => {
    console.log(profile)
    res.status(200).send()
  })
  .catch(err => {
    console.log(err)
    res.status(500).send()
  })
})

app.use(errorHandler)

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})