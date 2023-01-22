import * as functions from '@google-cloud/functions-framework'

// Register an HTTP function with the Functions Framework
functions.http('chk1', async (req, res) => {
  res.send('OK')
})
