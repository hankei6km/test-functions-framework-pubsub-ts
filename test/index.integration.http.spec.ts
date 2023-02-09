import { jest } from '@jest/globals'
// https://cloud.google.com/functions/docs/testing/test-http?hl=ja
// https://github.com/GoogleCloudPlatform/functions-framework-nodejs/blob/master/docs/testing-functions.md#testing-http-functions
import supertest from 'supertest'
import { getTestServer } from '@google-cloud/functions-framework/testing'
import type { getReqId } from '../src/lib/reqid.js'

// TODO: `test/index.unit.http.spec.ts` と同じモック、共通化ででないか?
jest.unstable_mockModule('../src/lib/reqid.js', async () => {
  const mockGetReqId = jest.fn<typeof getReqId>()
  const reset = () => {
    mockGetReqId.mockReset().mockImplementation(async (p) => {
      return {
        filter: 'test-fileter',
        sunbscription: 'test-subscription',
        handleId: 'test-handleid'
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
