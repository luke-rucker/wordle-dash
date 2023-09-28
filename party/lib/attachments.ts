import type { User } from '@party/lib/tokens'
import type * as Party from 'partykit/server'

type Attachment = {
  user: User | null
  country: string | null
}

export const attachments = {
  get(ws: Party.PartyConnection): Attachment {
    return ws.deserializeAttachment() || { user: null, country: null }
  },
  set(ws: Party.PartyConnection, attachment: Partial<Attachment>) {
    ws.serializeAttachment({ ...ws.deserializeAttachment(), ...attachment })
  },
}
