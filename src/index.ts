import * as functions from '@google-cloud/functions-framework'
import express from 'express'
import { PubSub } from '@google-cloud/pubsub'
import { getReqId } from './lib/reqid.js'

// バリデーション摘なものを入れる.
const topicNameOrId = process.env.TOPID || ''

const app = express()
const pubSubClient = new PubSub()

const router = express.Router()
app.use(router)
router.get('/', (req, res, next) => {
  getReqId({
    sheetId: '', // from request.
    bundleId: '', // from request.
    password: '', // from secret(ev var)
    salt: '' // from secret(ev var)
  })
    .then(async (info) => {
      await pubSubClient
        .topic(topicNameOrId)
        .createSubscription(info.sunbscription, {
          filter: `attributes.reqid = "${info.filter}"`
        })
      res.json({ handleId: info.handleId })
    })
    .then(next)
    .catch((err) => next(err))
})

// Register an HTTP function with the Functions Framework
functions.http('chk1', app)
