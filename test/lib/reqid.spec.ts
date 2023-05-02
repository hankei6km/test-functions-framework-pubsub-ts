import { jest } from '@jest/globals'
import * as orgCrypto from 'node:crypto'
import { createCipheriv, randomUUID } from 'node:crypto'

jest.unstable_mockModule('node:crypto', async () => {
  const mockCreateCipheriv = jest.fn<typeof createCipheriv>()
  const mockrandomUUID = jest.fn<typeof randomUUID>()
  const reset = () => {
    mockCreateCipheriv.mockReset().mockImplementation(createCipheriv)
    mockrandomUUID
      .mockReset()
      .mockImplementation(() => '50a11b0b-fea7-47b3-9934-b2191b5b6b29')
  }

  reset()
  return {
    ...orgCrypto,
    createCipheriv: mockCreateCipheriv,
    randomUUID: mockrandomUUID,
    _reset: reset,
    _getMocks: () => ({ mockCreateCipheriv, mockrandomUUID })
  }
})
const mockCrypto = await import('node:crypto')
const { dec, enc, getReqId } = await import('../../src/lib/reqid.js')

afterEach(() => {
  ;(mockCrypto as any)._reset()
})

describe('enc dec', () => {
  it('encrypt and decrypt text', async () => {
    const text = 'test1'
    const password = 'secret password'
    const salt = 'secret salt'
    const { mockCreateCipheriv } = (mockCrypto as any)._getMocks()

    const m = await enc(text, password, salt)
    // メソッドをコールしていたら暗号化されているだろう、ということにする.
    expect(mockCreateCipheriv).toBeCalledTimes(1)
    const a = m.split(':')
    expect(Array.isArray(a)).toBeTruthy()
    expect(a.length).toEqual(2)
    expect(await dec(m, password, salt)).toEqual(text)
  })

  it('failed encription', async () => {
    const text = 'test1'
    const password = 'secret password'

    // scrypt 自体がエラーになる。コールバックで err を受け取る状況の作り方は不明.
    expect(enc(text, password, undefined as any)).rejects.toThrowError()
  })

  it('failed decryption(salt is undefined)', async () => {
    const text = 'test1'
    const password = 'secret password'
    const salt = 'secret salt'

    const m = await enc(text, password, salt)
    // scrypt 自体がエラーになる。コールバックで err を受け取る状況の作り方は不明.
    expect(dec(m, password, undefined as any)).rejects.toThrowError()
  })

  it('failed decryption(invalid data)', async () => {
    const password = 'secret password'
    const salt = 'secret salt'

    expect(dec('123', password, salt)).rejects.toThrow(/Invalid data.*0 count/)
  })

  it('failed decryption(empty iv)', async () => {
    const password = 'secret password'
    const salt = 'secret salt'

    expect(dec(':123', password, salt)).rejects.toThrow(
      /Invalid initialization vector/
    )
  })

  it('failed decryption(invalid data)', async () => {
    const text = 'test1'
    const password = 'secret password'
    const salt = 'secret salt'
    const { mockCreateCipheriv } = (mockCrypto as any)._getMocks()

    const m = `${await enc(text, password, salt)}ABCD`
    expect(dec(m, password, salt)).rejects.toThrow(/wrong final block length/)
  })
})

describe('getReqId', () => {
  it('make request infromation', async () => {
    const password = 'secret password'
    const salt = 'secret salt'
    const { mockCreateCipheriv } = (mockCrypto as any)._getMocks()

    const i = await getReqId({ password, salt, sheetId: '', bundleId: '' })
    expect(i.sunbscription).toEqual('req-50a11b0b-fea7-47b3-9934-b2191b5b6b29') // randomUUID を固定してあるので、常に同じ値.
    expect(i.filter).toEqual(
      '00fc2b4541cfc9128161c10a88d1bda33f0fa90416dfbac1e357e170ed68e90b'
    ) // randomUUID を固定してあるので、常に同じ値.

    // handleId はメソッドをコールしていたら暗号化されているだろう、ということにする.
    expect(mockCreateCipheriv).toBeCalledTimes(1)
    const a = i.handleId.split(':')
    expect(Array.isArray(a)).toBeTruthy()
    expect(a.length).toEqual(2)
  })
})
