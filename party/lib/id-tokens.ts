import { uid } from 'uid'
import * as jose from 'jose'

const alg = 'HS256'
const issuer = 'word-dash'
const audience = 'word-dash'

let secret: Uint8Array

function getSecret(rawSecret: string) {
  if (!secret) {
    secret = new TextEncoder().encode(rawSecret)
  }
  return secret
}

export async function createIdToken(rawSecret: string) {
  const userId = uid()
  const token = await new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime('1yr')
    .sign(getSecret(rawSecret))
  return { userId, token }
}

export async function verifyIdToken(token: string, rawSecret: string) {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret(rawSecret), {
      issuer,
      audience,
    })
    if (!payload.sub) return null
    return payload.sub
  } catch (err) {
    return null
  }
}
