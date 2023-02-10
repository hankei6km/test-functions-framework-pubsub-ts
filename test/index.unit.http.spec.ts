import { jest } from '@jest/globals'
// https://cloud.google.com/functions/docs/testing/test-http?hl=ja
// https://github.com/GoogleCloudPlatform/functions-framework-nodejs/blob/master/docs/testing-functions.md#testing-http-functions
import { getFunction } from '@google-cloud/functions-framework/testing'
import type {
  HandlerFunction,
  Request,
  Response,
  HttpFunction
} from '@google-cloud/functions-framework'
import util from 'node:util'
import * as child_process from 'node:child_process'
const exec = util.promisify(child_process.exec)
import type { getReqId } from '../src/lib/reqid.js'

// 各種定義
// topics
const topid = 'test-unit-topic-id'
// subscriptions
const sunbscription = 'req-test-subscription'
const filter = 'test-fileter'
const handleId = 'test-handleid'

// TODO: `test/index.integration.http.spec.ts` と同じモック、共通化ででないか?
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
  const getMocks = () => {
    const req = { body: {}, query: {} } as any as Request

    return {
      req: req,
      res: {
        json: jest.fn()
      } as any as Response
    }
  }

  const isHttpFunction = (
    func: HandlerFunction | undefined
  ): func is HttpFunction => {
    // TODO: HttpFunction であるかの判定を確実にできるか調べる.
    if (typeof func === 'function' && func.length === 2) {
      return true
    }
    return false
  }

  beforeAll(async () => {
    // load the module that defines `chk1`
    await import('../src/index.js')
  })

  it('chk1: should send `OK`', async () => {
    const mocks = getMocks()

    const func = getFunction('chk1')
    if (!isHttpFunction(func)) {
      throw new Error('fucntion is not HttpFunction')
    }

    await func(mocks.req, mocks.res)

    const { mockGetReqId } = (mockReqid as any)._getMocks()
    // とりあえず
    expect(mockGetReqId).toBeCalledWith({
      sheetId: '',
      bundleId: '',
      password: '',
      salt: ''
    })
    expect(mocks.res.json).toBeCalledWith({
      handleId: 'test-handleid'
    })
  })
})
