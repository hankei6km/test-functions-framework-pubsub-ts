import {
  randomUUID,
  createHash,
  scrypt,
  randomFill,
  createCipheriv,
  createDecipheriv
} from 'node:crypto'

const algorithm = 'aes-192-cbc'

export async function enc(
  src: string,
  password: string,
  salt: string
): Promise<string> {
  return new Promise((resolve) => {
    // First, we'll generate the key. The key length is dependent on the algorithm.
    // In this case for aes192, it is 24 bytes (192 bits).
    scrypt(password, salt, 24, (err, key) => {
      if (err) throw err
      // Then, we'll generate a random initialization vector
      randomFill(new Uint8Array(16), (err, iv) => {
        if (err) throw err

        const cipher = createCipheriv(algorithm, key, iv)

        let encrypted = cipher.update(src, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        //console.log(encrypted)
        resolve(`${Buffer.from(iv).toString('hex')}:${encrypted}`)
      })
    })
  })
}

export async function dec(
  enced: string,
  password: string,
  salt: string
): Promise<string> {
  const a = enced.split(':')
  if (a.length != 2) {
    throw new Error(
      `Invalid data(":" is contained ${a.length - 1} count, valid count = 1)`
    )
  }
  const [iv, data] = a
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 24, (err, key) => {
      try {
        const decipher = createDecipheriv(
          algorithm,
          key,
          Buffer.from(iv, 'hex')
        )
        let decrypted = decipher.update(data, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        resolve(decrypted)
      } catch (err) {
        reject(err)
      }
    })
  })
}

/**
 * Information for handling request.
 */
export type ReqInfo = {
  /**
   * The id of subscription that is used to receive response from user.
   * it has prefix with `req-`
   */
  sunbscription: string
  /**
   * Text data to used filter message(ie. filter: `attributes.reqId = "${filter}"`)
   */
  filter: string
  /**
   * The handleing id to pass to polling clients.
   * It's an encrypted subscription id(iv:data) that is used to pull response.
   */
  handleId: string
}

/**
 * Information for handling request.
 */
export type MakeReqInfoParams = {
  /**
   * A password to used encryption/decryption of `aes-192-cbc`.
   */
  password: string
  /**
   * A password to used encryption/decryption of `aes-192-cbc`.
   */
  salt: string
  // ここはまだ固まっていない
  sheetId: string
  bundleId: string
}

/**
 * Make info for handle request.
 * @returns the information data.
 */
export async function getReqId(params: MakeReqInfoParams): Promise<ReqInfo> {
  const sunbscription = `req-${randomUUID()}`
  const filter = createHash('sha256')
    .update(sunbscription, 'utf8')
    .digest('hex')
  const handleId = await enc(sunbscription, params.password, params.salt)
  return {
    sunbscription,
    filter,
    handleId
  }
}
