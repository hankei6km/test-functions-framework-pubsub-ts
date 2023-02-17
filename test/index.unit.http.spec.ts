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
import { getMockReq, getMockRes } from '@jest-mock/express'
import util from 'node:util'
import * as child_process from 'node:child_process'
const exec = util.promisify(child_process.exec)
import { PubSub, Subscription } from '@google-cloud/pubsub'
import type {
  createSubWithInfo,
  getValidSub,
  handleMessage
} from '../src/lib/pubsub.js'

// 各種定義
// pubsub
const mockClient = new PubSub()
const mockSub = 'test-sub-mock' as any as Subscription
const mockMessage = { data: 'test-message-mock' }
// topics
const topid = 'test-unit-topic-id'
// subscriptions
const sunbscription = 'req-test-subscription'
const filter = 'test-fileter'
const handleId = 'test-handleid'
const subscriptionDuration = '2000'
const messagePullTimeout = '500'

jest.unstable_mockModule('@google-cloud/pubsub', async () => {
  const mockPubSub = jest.fn<() => typeof mockClient>()
  const reset = () => {
    mockPubSub.mockReset().mockImplementation(() => {
      return mockClient
    })
  }
  reset()
  return {
    PubSub: mockPubSub,
    _reset: reset,
    _getMocks: () => ({
      mockPubSub
    })
  }
})
jest.unstable_mockModule('../src/lib/pubsub.js', async () => {
  const mockCreateSubWithInfo = jest.fn<typeof createSubWithInfo>()
  const mockGetValidSub = jest.fn<typeof getValidSub>()
  const mockHandleMessage = jest.fn<typeof handleMessage>()
  const reset = () => {
    mockCreateSubWithInfo.mockReset().mockImplementation(async (p) => {
      return {
        sunbscription,
        filter,
        handleId
      }
    })
    mockGetValidSub.mockReset().mockResolvedValue(mockSub)
    mockHandleMessage.mockReset().mockResolvedValue(mockMessage)
  }

  reset()
  return {
    createSubWithInfo: mockCreateSubWithInfo,
    getValidSub: mockGetValidSub,
    handleMessage: mockHandleMessage,
    _reset: reset,
    _getMocks: () => ({
      mockCreateSubWithInfo,
      mockGetValidSub,
      mockHandleMessage
    })
  }
})
const mockPubsub = await import('../src/lib/pubsub.js')
const OLD_TOPID = process.env.TOPID
const OLD_SUBSCRIPTION_DURATION = process.env.SUBSCRIPTION_DURATION
const OLD_MESSAGE_PULL_TIMEOUT = process.env.MESSAGE_PULL_TIMEOUT

afterEach(() => {
  ;(mockPubsub as any)._reset()
})

describe('functions', () => {
  const { res, next, clearMockRes } = getMockRes()
  beforeEach(() => {
    clearMockRes()
  })
  const getMocks = (method: string, url: string) => {
    //const req = { body: {}, query: {} } as any as Request

    return {
      req: getMockReq({
        method,
        url
      }),
      res,
      next
    }
  }

  const isHttpFunction = (
    func: HandlerFunction | undefined
  ): func is HttpFunction => {
    // TODO: HttpFunction であるかの判定を確実にできるか調べる.
    if (
      typeof func === 'function' &&
      (func.length === 2 || func.length === 3)
    ) {
      return true
    }
    return false
  }

  beforeAll(async () => {
    process.env.TOPID = topid
    process.env.SUBSCRIPTION_DURATION = subscriptionDuration
    process.env.MESSAGE_PULL_TIMEOUT = messagePullTimeout
    // load the module that defines `chk1`
    await import('../src/index.js')
  })
  afterAll(async () => {
    process.env.SUBSCRIPTION_DURATION = OLD_SUBSCRIPTION_DURATION
    process.env.MESSAGE_PULL_TIMEOUT = OLD_MESSAGE_PULL_TIMEOUT
    process.env.TOPID = OLD_TOPID
  })

  it('chk1: should redirects to `/status/:handlId`', async () => {
    const func = getFunction('chk1')
    if (!isHttpFunction(func)) {
      throw new Error('fucntion is not HttpFunction')
    }

    const mocks = getMocks('GET', '/')
    await util.promisify(func)(mocks.req, mocks.res)

    const { mockCreateSubWithInfo } = (mockPubsub as any)._getMocks()
    // とりあえず
    expect(mockCreateSubWithInfo).toBeCalledWith(mockClient, topid, {
      sheetId: '',
      bundleId: '',
      password: '',
      salt: ''
    })
    expect(mocks.res.status).toBeCalledWith(301)
    expect(mocks.res.location).toBeCalledWith('/status/test-handleid?c=0')
    expect(mocks.res.send).toBeCalledWith()
  })

  it('chk1: should send data that is pulled from subscription', async () => {
    const { mockCreateSubWithInfo, mockGetValidSub, mockHandleMessage } = (
      mockPubsub as any
    )._getMocks()

    const func = getFunction('chk1')
    if (!isHttpFunction(func)) {
      throw new Error('fucntion is not HttpFunction')
    }

    const pfunc = util.promisify(func)

    // `/` でリクエスト
    const mocks = getMocks('GET', '/')
    await pfunc(mocks.req, mocks.res)

    // とりあえず
    expect(mockCreateSubWithInfo).toBeCalledWith(mockClient, topid, {
      sheetId: '',
      bundleId: '',
      password: '',
      salt: ''
    })
    expect(mocks.res.status).toBeCalledWith(301)
    expect(mocks.res.location).toBeCalledWith('/status/test-handleid?c=0')
    expect(mocks.res.send).toBeCalledWith()

    // リダイレクト
    clearMockRes() // TODO: res モックの扱いをもう少し考える。あるいはテストの構成を考える
    const mocksR1 = getMocks('GET', '/status/test-handleid?c=0')
    await pfunc(mocksR1.req, mocksR1.res)

    expect(mockGetValidSub).toBeCalledWith(
      mockClient,
      Number.parseInt(subscriptionDuration, 10),
      handleId
    )
    expect(mockHandleMessage).toBeCalledWith(
      mockSub,
      Number.parseInt(messagePullTimeout, 10)
    )
    expect(mocksR1.res.status).toBeCalledTimes(0)
    expect(mocksR1.res.location).toBeCalledTimes(0)
    expect(mocksR1.res.json).toBeCalledWith({ message: 'test-message-mock' })
    // pull でタイムアウトしたときも試す?
    // - integragted でテストしている
    // - `pubsub.ts` の unit テストを作る予定
  })
})
