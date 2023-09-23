import { uid } from 'uid/secure'
import jwt from '@tsndr/cloudflare-worker-jwt'

const algorithm = 'HS256'
const iss = 'word-dash'
const aud = 'word-dash'
const oneYear = 60 * 60 * 24 * 365

export const tokens = {
  async issue(secret: string) {
    const userId = uid()
    const now = Math.floor(Date.now() / 1000)
    const token = await jwt.sign(
      { sub: userId, iat: now, iss, aud, exp: now + oneYear },
      secret,
      { algorithm }
    )
    return { userId, token }
  },
  async verify(token: string, secret: string) {
    const isValid = await jwt.verify(token, secret, { algorithm })
    if (!isValid) return null
    const { payload } = jwt.decode(token)
    if (payload.aud !== aud) return null
    if (payload.iss !== iss) return null
    if (!payload.sub) return null
    return payload.sub
  },
}
