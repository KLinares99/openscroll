/**
 * Read-aloud via the browser's built-in speech synthesis — no audio files, no
 * licensing, and it works offline on iOS and Android.
 */
export function speak(text: string) {
  const synth = window.speechSynthesis
  if (!synth) return
  if (synth.speaking) {
    synth.cancel()
    return
  }
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.95
  utterance.pitch = 1
  synth.speak(utterance)
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
}
