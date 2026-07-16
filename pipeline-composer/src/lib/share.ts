/**
 * Reads a pipeline handed off from the docs "Open in Composer" link. The docs
 * widget encodes a Blockly workspace (see the spaCy website's
 * src/widgets/blockly/share.ts) into the URL fragment
 * `#pipeline=<base64url(JSON)>`. Kept in the fragment, not a query string, so
 * the static host never receives the payload.
 */
const SHARE_PARAM = "pipeline"

function fromBase64Url(encoded: string): string {
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
  // Re-pad: the encoder strips '=' and atob can reject unpadded input.
  const remainder = base64.length % 4
  if (remainder) base64 += "=".repeat(4 - remainder)
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Parse `#pipeline=…` from the current URL into workspace JSON, or null. */
export function readSharedWorkspace(): unknown | null {
  if (typeof window === "undefined" || !window.location.hash) return null
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const encoded = params.get(SHARE_PARAM)
  if (!encoded) return null
  try {
    return JSON.parse(fromBase64Url(encoded))
  } catch {
    return null
  }
}

/**
 * Drop the share fragment once consumed so a reload doesn't re-import over the
 * user's edits (which persist to localStorage as usual).
 */
export function clearShareHash(): void {
  if (typeof window === "undefined" || !window.location.hash) return
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  params.delete(SHARE_PARAM)
  const rest = params.toString()
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search + (rest ? `#${rest}` : "")
  )
}
