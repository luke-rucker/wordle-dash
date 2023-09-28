import { uid } from 'uid/secure'
import jwt from '@tsndr/cloudflare-worker-jwt'

const algorithm = 'HS256'
const iss = 'word-dash'
const aud = 'word-dash'
const oneYear = 60 * 60 * 24 * 365

type UserType = 'anon' | 'verified'

export type User = {
  id: string
  type: UserType
}

export const tokens = {
  async issue(secret: string): Promise<{ user: User; token: string }> {
    const id = uid()
    const now = Math.floor(Date.now() / 1000)
    const token = await jwt.sign(
      { sub: id, iat: now, iss, aud, exp: now + oneYear },
      secret,
      { algorithm }
    )
    return { user: { id, type: 'anon' }, token }
  },
  async verify(token: string, secret: string): Promise<User | null> {
    const isValid = await jwt.verify(token, secret, { algorithm })
    if (!isValid) return null
    const { payload } = jwt.decode(token)

    if (payload.aud === 'authenticated') {
      if (!payload.sub) return null
      return { id: payload.sub!, type: 'verified' }
    }

    if (payload.aud !== aud) return null
    if (payload.iss !== iss) return null
    if (!payload.sub) return null
    return { id: payload.sub, type: 'anon' }
  },
}
