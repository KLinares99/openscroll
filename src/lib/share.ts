/** Share or copy a verse. Falls back to the clipboard when there is no share sheet. */
export async function shareVerse(reference: string, text: string, translation: string) {
  const body = `“${text}”\n— ${reference} (${translation})`
  if (navigator.share) {
    try {
      await navigator.share({ title: reference, text: body })
      return 'shared'
    } catch {
      // The reader dismissed the sheet, or sharing is unavailable — fall through.
    }
  }
  return copy(body)
}

export async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
