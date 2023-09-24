import type * as Party from 'partykit/server'

type Attachment = {
  userId: string | null
  country: string | null
}

export const attachments = {
  get(ws: Party.PartyConnection): Attachment {
    return ws.deserializeAttachment() || { userId: null, country: null }
  },
  set(ws: Party.PartyConnection, attachment: Partial<Attachment>) {
    ws.serializeAttachment({ ...ws.deserializeAttachment(), ...attachment })
  },
}
