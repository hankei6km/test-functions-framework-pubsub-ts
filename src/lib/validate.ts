import { RequestHandler } from 'express'
import { check, validationResult } from 'express-validator'

export const validateReqInfoParams: RequestHandler =
  async function validateReqInfoParams(req, res, next) {
    await check('sheetId').notEmpty().isString().run(req)
    const e = validationResult(req)
    await check('bundleId').notEmpty().isString().run(req)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() })
      return next('router')
    }
    next()
  }
