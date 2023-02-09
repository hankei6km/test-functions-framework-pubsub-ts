import * as functions from '@google-cloud/functions-framework'
import { getReqId } from './lib/reqid.js'

// Register an HTTP function with the Functions Framework
functions.http('chk1', async (req, res) => {
  const info = await getReqId({
    sheetId: '', // from request.
    bundleId: '', // from request.
    password: '', // from secret(ev var)
    salt: '' // from secret(ev var)
  })
  res.json({ handleId: info.handleId })
})
