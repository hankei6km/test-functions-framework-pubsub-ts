import * as functions from '@google-cloud/functions-framework'
import express from 'express'
import { PubSub } from '@google-cloud/pubsub'
import { createSubWithInfo, getValidSub, handleMessage } from './lib/pubsub.js'

// バリデーション摘なものを入れる.
const topicNameOrId = process.env.TOPID || ''
const subscriptionDuration =
  Number.parseInt(process.env.SUBSCRIPTION_DURATION || '') || 60 * 2 * 1000
const messagePullTimeout =
  Number.parseInt(process.env.MESSAGE_PULL_TIMEOUT || '') || 10 * 1000

const app = express()
const pubSubClient = new PubSub()

const router = express.Router()
app.use(router)
router.get('/', (req, res, next) => {
  createSubWithInfo(pubSubClient, topicNameOrId, {
    sheetId: '', // from request.
    bundleId: '', // from request.
    password: '', // from secret(ev var)
    salt: '' // from secret(ev var)
  })
    .then(async (info) => {
      res.status(301)
      const params = new URLSearchParams({ c: '0' })
      res.location(`/status/${info.handleId}?${params.toString()}`)
      res.send()
    })
    .then(next)
    .catch((err) => next(err))
})
router.get('/status/:handleId', (req, res, next) => {
  getValidSub(pubSubClient, subscriptionDuration, req.params.handleId)
    .then((subscription) => handleMessage(subscription, messagePullTimeout))
    .then((message: any | null) => {
      if (message != null) {
        // ここで subscription を削除できるが、ExpirationPolicy にまかせる？
        res.json({ message: message.data.toString() })
      } else {
        res.status(301)
        res.location(`/status/${req.params.handleId}`)
        res.send()
      }
    })
    .catch((err) => {
      res.json({ errMessage: `${err.message}` })
    })
    .then(next)
  // ここで function を抜けても send がまだだから稼働状態でカウントされる?
  // クライアント側で間隔をあけるように指定する方法は 30x にはなさそう
  // http-equiv refresh だと curl では対応がめんどうそう
})

// Register an HTTP function with the Functions Framework
functions.http('chk1', app)
