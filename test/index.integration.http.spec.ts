import { jest } from '@jest/globals'
// https://cloud.google.com/functions/docs/testing/test-http?hl=ja
// https://github.com/GoogleCloudPlatform/functions-framework-nodejs/blob/master/docs/testing-functions.md#testing-http-functions
import supertest from 'supertest'
import { getTestServer } from '@google-cloud/functions-framework/testing'

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
      .expect('OK')
  })
})
