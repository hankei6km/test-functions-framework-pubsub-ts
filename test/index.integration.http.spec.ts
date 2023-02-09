import { jest } from '@jest/globals'
// https://cloud.google.com/functions/docs/testing/test-http?hl=ja
// https://github.com/GoogleCloudPlatform/functions-framework-nodejs/blob/master/docs/testing-functions.md#testing-http-functions
import supertest from 'supertest'
import { getTestServer } from '@google-cloud/functions-framework/testing'
import util from 'node:util'
import * as child_process from 'node:child_process'
const exec = util.promisify(child_process.exec)
import type { getReqId } from '../src/lib/reqid.js'

// 各種定義
// topics
const topid = 'test-integration-topic-id'
// subscriptions
const sunbscription = 'test-subscription'
const filter = 'test-fileter'
const handleId = 'test-handleid'

// TODO: `test/index.unit.http.spec.ts` と同じモック、共通化ででないか?
jest.unstable_mockModule('../src/lib/reqid.js', async () => {
  const mockGetReqId = jest.fn<typeof getReqId>()
  const reset = () => {
    mockGetReqId.mockReset().mockImplementation(async (p) => {
      return {
        sunbscription,
        filter,
        handleId
      }
    })
  }

  reset()
  return {
    getReqId: mockGetReqId,
    _reset: reset,
    _getMocks: () => ({ mockGetReqId })
  }
})
const mockReqid = await import('../src/lib/reqid.js')
const OLD_TOPID = process.env.TOPID

beforeAll(async () => {
  process.env.TOPID = topid
  await exec(`./scripts/topic-setup.sh ${process.env.TOPID}`)
})

afterAll(async () => {
  await exec(`./scripts/topic-cleanup.sh ${process.env.TOPID}`)
  process.env.TOPID = OLD_TOPID
})

afterEach(() => {
  ;(mockReqid as any)._reset()
})

describe('functions', () => {
  beforeAll(async () => {
    // load the module that defines `chk1`
    await import('../src/index.js')
  })

  it('chk1: should print `OK` with req body', async () => {
    const server = getTestServer('chk1')
    await supertest(server)
      .post('/')
      .send({})
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect({
        handleId: 'test-handleid'
      })
  })
})
