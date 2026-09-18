const TAG_RE = /<extended-info-md>([\s\S]*?)<\/extended-info-md>/i

export interface ExtractedMessage {
  /** The chat-bubble text, with the extended-info-md block removed. */
  visible: string
  /** The full markdown+chart report to show in the detail panel, or null if the message carries none. */
  detail: string | null
}

/**
 * A chat message from the assistant is one markdown string that may carry
 * its own detail report inline: `teaser text <extended-info-md># Report\n```chart...```</extended-info-md>`.
 * This splits the two apart so the host can render the teaser in the chat
 * bubble and, on click, hand `detail` straight to <md-detail-panel>.source
 * -- no second fetch, the message already carries everything it needs.
 */
export function extractExtendedInfo(source: string): ExtractedMessage {
  const match = TAG_RE.exec(source)
  if (!match) return { visible: source.trim(), detail: null }
  const detail = match[1].trim()
  const visible = (source.slice(0, match.index) + source.slice(match.index + match[0].length)).trim()
  return { visible, detail }
}
