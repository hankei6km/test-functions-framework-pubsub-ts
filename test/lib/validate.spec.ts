import type { Request } from '@google-cloud/functions-framework'
import util from 'node:util'
import { getMockReq, getMockRes } from '@jest-mock/express'
import { validateReqInfoParams } from '../../src/lib/validate.js'

describe('validateReqInfoParams', () => {
  const { res, next, clearMockRes } = getMockRes()
  beforeEach(() => {
    clearMockRes()
  })
  const getMocks = (method: string, url: string, query: Request['query']) => {
    return {
      req: getMockReq({
        method,
        url,
        query
      }),
      res,
      next
    }
  }

  it('should pass validation', async () => {
    const mocks = getMocks('GET', '/', { sheetId: 'abc', bundleId: '123' })
    await util.promisify(validateReqInfoParams)(mocks.req, mocks.res)

    expect(mocks.res.status).toBeCalledTimes(0)
  })

  it('should send 400(empty)', async () => {
    const mocks = getMocks('GET', '/', {})
    let thrown: any = ''
    await util
      .promisify(validateReqInfoParams)(mocks.req, mocks.res)
      .catch((err) => {
        thrown = err
      })

    expect(thrown).toEqual('router')
    expect(mocks.res.status).toBeCalledWith(400)
    expect(mocks.res.send).toBeCalledWith({
      errors: [
        //`.notEmpty().isString()` で 2 回エラーでメッセージが重複している.
        // 調整する方法を考える.
        {
          location: 'body',
          msg: 'Invalid value',
          param: 'sheetId',
          value: undefined
        },
        {
          location: 'body',
          msg: 'Invalid value',
          param: 'sheetId',
          value: undefined
        },
        {
          location: 'body',
          msg: 'Invalid value',
          param: 'bundleId',
          value: undefined
        },
        {
          location: 'body',
          msg: 'Invalid value',
          param: 'bundleId',
          value: undefined
        }
      ]
    })
  })

  it('should send 400(array)', async () => {
    const mocks = getMocks('GET', '/', { sheetId: ['abc'], bundleId: ['123'] })
    let thrown: any = ''
    await util
      .promisify(validateReqInfoParams)(mocks.req, mocks.res)
      .catch((err) => {
        thrown = err
      })

    expect(thrown).toEqual('router')
    expect(mocks.res.status).toBeCalledWith(400)
    expect(mocks.res.send).toBeCalledWith({
      errors: [
        //`.notEmpty().isString()` で 2 回エラーでメッセージが重複している.
        // 調整する方法を考える.
        {
          location: 'query',
          msg: 'Invalid value',
          param: 'sheetId',
          value: ['abc']
        },
        {
          location: 'query',
          msg: 'Invalid value',
          param: 'bundleId',
          value: ['123']
        }
      ]
    })
  })
})
