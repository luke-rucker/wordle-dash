import type * as Party from 'partykit/server'

type Attachment = {
  userId: string | null
}

export const attachments = {
  get(ws: Party.PartyConnection) {
    return ws.deserializeAttachment() || { userId: null }
  },
  set(ws: Party.PartyConnection, attachment: Attachment) {
    ws.serializeAttachment(attachment)
  },
}
