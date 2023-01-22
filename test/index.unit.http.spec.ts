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

describe('functions', () => {
  const getMocks = () => {
    const req = { body: {}, query: {} } as any as Request

    return {
      req: req,
      res: {
        send: jest.fn()
      } as any as Response
    }
  }

  const isHttpFunction = (
    func: HandlerFunction | undefined
  ): func is HttpFunction => {
    // TODO: HttpFunction であるかの判定を確実にできるか調べる.
    if (typeof func === 'function' && func.length !== 2) {
      return false
    }
    return true
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

    expect(mocks.res.send).toBeCalledWith('OK')
  })
})
