/** Showdown-compatible id from a display name. */
export function toId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}
