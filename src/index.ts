import * as functions from '@google-cloud/functions-framework'
import { PubSub } from '@google-cloud/pubsub'
import { getReqId } from './lib/reqid.js'

const pubSubClient = new PubSub()

// バリデーション摘なものを入れる.
const topicNameOrId = process.env.TOPID || ''

// Register an HTTP function with the Functions Framework
functions.http('chk1', async (req, res) => {
  const info = await getReqId({
    sheetId: '', // from request.
    bundleId: '', // from request.
    password: '', // from secret(ev var)
    salt: '' // from secret(ev var)
  })
  await pubSubClient
    .topic(topicNameOrId)
    .createSubscription(info.sunbscription, {
      filter: `attributes.reqid = "${info.filter}"`
    })
  res.json({ handleId: info.handleId })
})
