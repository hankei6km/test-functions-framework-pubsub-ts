import { jest } from '@jest/globals'
// https://cloud.google.com/functions/docs/testing/test-http?hl=ja
// https://github.com/GoogleCloudPlatform/functions-framework-nodejs/blob/master/docs/testing-functions.md#testing-http-functions
import supertest from 'supertest'
import { getTestServer } from '@google-cloud/functions-framework/testing'
import util from 'node:util'
import * as child_process from 'node:child_process'
const exec = util.promisify(child_process.exec)

// 各種定義
// query
const sheetId = 'test-sheetid'
const bundleId = 'bundle-sheetid'
// topics
const topid = 'test-integration-topic-id'
// subscriptions
const subscriptionDuration = '2000'
const messagePullTimeout = '500'

const OLD_TOPID = process.env.TOPID
const OLD_SUBSCRIPTION_DURATION = process.env.SUBSCRIPTION_DURATION
const OLD_MESSAGE_PULL_TIMEOUT = process.env.MESSAGE_PULL_TIMEOUT

describe('functions', () => {
  beforeAll(async () => {
    process.env.TOPID = topid
    process.env.SUBSCRIPTION_DURATION = subscriptionDuration
    process.env.MESSAGE_PULL_TIMEOUT = messagePullTimeout
    // load the module that defines `chk1`
    await import('../src/index.js')
  })
  afterAll(async () => {
    process.env.TOPID = OLD_TOPID
    process.env.SUBSCRIPTION_DURATION = OLD_SUBSCRIPTION_DURATION
    process.env.MESSAGE_PULL_TIMEOUT = OLD_MESSAGE_PULL_TIMEOUT
  })

  beforeEach(async () => {
    await exec(`./scripts/topic-setup.sh ${topid}`)
  })
  afterEach(async () => {
    await exec(`./scripts/topic-cleanup.sh ${topid}`)
  })

  it('chk1: should exists a subscription during redirections', async () => {
    const p = new Promise<void>((resolve) => {
      setTimeout(async () => {
        // タイミング依存.
        // PubSub emulator はフィルターを考慮しないことを利用している.
        await exec(`./scripts/topic-publish.sh ${topid}`)
        resolve()
      }, 1000)
    })
    const server = getTestServer('chk1')
    await supertest(server)
      .get('/')
      .query({ sheetId, bundleId })
      .send({})
      .set('Content-Type', 'application/json')
      .redirects(5)
      .expect({ message: 'test message' })

    await p
  })

  it('chk1: should expire a subscription', async () => {
    const server = getTestServer('chk1')
    await supertest(server)
      .get('/')
      .query({ sheetId, bundleId })
      .send({})
      .set('Content-Type', 'application/json')
      .redirects(5)
      .expect({ errMessage: 'expiered' })
  })

  it('chk1: should send 400 when query is invalid', async () => {
    const server = getTestServer('chk1')
    await supertest(server)
      .get('/')
      .query({})
      .send({})
      .set('Content-Type', 'application/json')
      .redirects(5)
      .expect({
        errors: [
          { msg: 'Invalid value', param: 'sheetId', location: 'body' },
          { msg: 'Invalid value', param: 'sheetId', location: 'body' },
          { msg: 'Invalid value', param: 'bundleId', location: 'body' },
          { msg: 'Invalid value', param: 'bundleId', location: 'body' }
        ]
      })
  })
})
