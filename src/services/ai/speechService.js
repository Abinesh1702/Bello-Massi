/**
 * Speech adapters for Jarvis.
 *  STT: 'browser' → Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 *       'openjarvis' → MediaRecorder clip uploaded to OpenJarvis /v1/speech/transcribe
 *  TTS: 'browser' → speechSynthesis
 *       'openjarvis' → OpenJarvis /v1/speech/synthesize (WAV) played through an <audio> element
 * Everything feature-detects and reports "unsupported" instead of throwing.
 */
import { synthesizeSpeech, transcribeSpeech } from './aiProviderService'

const w = typeof window !== 'undefined' ? window : {}

export const speechSupport = () => ({
  recognition: Boolean(w.SpeechRecognition || w.webkitSpeechRecognition),
  synthesis: Boolean(w.speechSynthesis && w.SpeechSynthesisUtterance),
  mediaRecorder: Boolean(w.MediaRecorder && w.navigator?.mediaDevices?.getUserMedia),
  secureContext: Boolean(w.isSecureContext),
})

const RECOGNITION_ERRORS = {
  'not-allowed': 'Microphone permission was denied. Allow microphone access in the browser address bar, or type your command.',
  'service-not-allowed': 'Speech recognition is blocked in this browser. Type your command instead.',
  'no-speech': 'No speech was detected. Try again closer to the microphone.',
  'audio-capture': 'No microphone was found.',
  network: 'Speech recognition needs a network connection in this browser.',
  aborted: 'Listening stopped.',
  'language-not-supported': 'This language is not supported for speech recognition.',
}

/**
 * Start listening. Returns a controller { stop(), abort() }.
 * cb: { onStart, onPartial(text), onFinal(text), onError(message), onEnd }
 */
export const startRecognition = ({ engine = 'browser', language = 'en-IN', continuous = false }, cb) => {
  if (engine === 'openjarvis') return startRecordingClip({ language }, cb)
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!SR) {
    cb.onError?.('Voice input is not supported in this browser. Use Chrome or Edge, or type your command.')
    cb.onEnd?.()
    return { stop() {}, abort() {} }
  }
  let rec
  try {
    rec = new SR()
  } catch {
    cb.onError?.('Speech recognition could not start.')
    cb.onEnd?.()
    return { stop() {}, abort() {} }
  }
  rec.lang = language
  rec.interimResults = true
  rec.continuous = continuous
  rec.maxAlternatives = 1
  let finalText = ''
  rec.onstart = () => cb.onStart?.()
  rec.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i += 1) {
      const r = e.results[i]
      if (r.isFinal) finalText += r[0].transcript
      else interim += r[0].transcript
    }
    if (interim) cb.onPartial?.(`${finalText}${interim}`)
    if (finalText && !continuous) cb.onFinal?.(finalText.trim())
  }
  rec.onerror = (e) => { if (e.error !== 'aborted') cb.onError?.(RECOGNITION_ERRORS[e.error] || `Speech recognition error: ${e.error}`) }
  rec.onend = () => {
    if (continuous && finalText) cb.onFinal?.(finalText.trim())
    cb.onEnd?.()
  }
  try {
    rec.start()
  } catch (e) {
    cb.onError?.(`Could not start listening (${e?.message || 'busy'}).`)
    cb.onEnd?.()
  }
  return { stop: () => { try { rec.stop() } catch { /* already stopped */ } }, abort: () => { try { rec.abort() } catch { /* already stopped */ } } }
}

/** OpenJarvis STT: record until stop(), then upload. */
const startRecordingClip = ({ language }, cb) => {
  if (!speechSupport().mediaRecorder) {
    cb.onError?.('Recording is not supported in this browser.')
    cb.onEnd?.()
    return { stop() {}, abort() {} }
  }
  let recorder = null
  let stream = null
  let aborted = false
  const chunks = []
  const cleanup = () => stream?.getTracks().forEach((t) => t.stop())
  w.navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
    stream = s
    if (aborted) { cleanup(); return }
    recorder = new w.MediaRecorder(s)
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
    recorder.onstop = async () => {
      cleanup()
      if (aborted || !chunks.length) { cb.onEnd?.(); return }
      cb.onPartial?.('Transcribing with OpenJarvis…')
      const r = await transcribeSpeech(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }), { language })
      if (r.ok && r.text) cb.onFinal?.(r.text.trim())
      else cb.onError?.(r.error || 'No speech was recognised.')
      cb.onEnd?.()
    }
    recorder.start()
    cb.onStart?.()
  }).catch((e) => {
    cb.onError?.(e?.name === 'NotAllowedError' ? RECOGNITION_ERRORS['not-allowed'] : `Microphone unavailable (${e?.message || e?.name}).`)
    cb.onEnd?.()
  })
  return {
    stop: () => { if (recorder?.state === 'recording') recorder.stop() },
    abort: () => { aborted = true; if (recorder?.state === 'recording') recorder.stop(); else cleanup() },
  }
}

/* ---------------- TTS ---------------- */

export const listVoices = () => {
  try { return w.speechSynthesis ? w.speechSynthesis.getVoices() : [] } catch { return [] }
}

/** Plain text for speaking: drop markdown-ish symbols and long tables. */
export const speakableText = (text) => String(text || '').replace(/[*_#`>|]/g, ' ').replace(/₹/g, 'rupees ').replace(/\bAED\s?/g, 'dirhams ').replace(/\s+/g, ' ').trim().slice(0, 900)

/**
 * Create a speaker. Returns { speak(text), pause(), resume(), stop(), engine }.
 * cb: { onStart, onEnd, onPause, onResume, onError }
 */
export const createSpeaker = ({ engine = 'browser', voiceURI = '', rate = 1, volume = 1, pitch = 1, language = 'en-IN' }, cb = {}) => {
  if (engine === 'openjarvis') {
    let audio = null
    let url = null
    const release = () => { if (url) URL.revokeObjectURL(url); url = null }
    return {
      engine,
      speak: async (text) => {
        cb.onStart?.()
        const r = await synthesizeSpeech(speakableText(text), { speed: rate })
        if (!r.ok) { cb.onError?.(r.error); cb.onEnd?.(); return }
        release()
        url = URL.createObjectURL(r.blob)
        audio = new Audio(url)
        audio.volume = Math.max(0, Math.min(1, volume))
        audio.onended = () => { release(); cb.onEnd?.() }
        audio.onerror = () => { cb.onError?.('Could not play the OpenJarvis audio.'); cb.onEnd?.() }
        audio.play().catch((e) => { cb.onError?.(`Playback blocked (${e?.name}). Click Play to retry.`); cb.onEnd?.() })
      },
      pause: () => { if (audio && !audio.paused) { audio.pause(); cb.onPause?.() } },
      resume: () => { if (audio && audio.paused) { audio.play().catch(() => {}); cb.onResume?.() } },
      stop: () => { if (audio) { audio.pause(); audio.currentTime = 0 } release(); cb.onEnd?.() },
    }
  }
  const synth = w.speechSynthesis
  if (!synth || !w.SpeechSynthesisUtterance) {
    return { engine, unsupported: true, speak: () => cb.onError?.('Text-to-speech is not supported in this browser.'), pause() {}, resume() {}, stop() {} }
  }
  return {
    engine,
    speak: (text) => {
      try {
        synth.cancel()
        const u = new w.SpeechSynthesisUtterance(speakableText(text))
        const v = listVoices().find((x) => x.voiceURI === voiceURI)
        if (v) u.voice = v
        u.lang = v?.lang || language
        u.rate = Math.max(0.5, Math.min(2, rate))
        u.volume = Math.max(0, Math.min(1, volume))
        u.pitch = Math.max(0, Math.min(2, pitch))
        u.onstart = () => cb.onStart?.()
        u.onend = () => cb.onEnd?.()
        u.onpause = () => cb.onPause?.()
        u.onresume = () => cb.onResume?.()
        u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') cb.onError?.(`Speech error: ${e.error}`); cb.onEnd?.() }
        synth.speak(u)
      } catch (e) {
        cb.onError?.(`Speech failed (${e?.message}).`)
      }
    },
    pause: () => { try { synth.pause(); cb.onPause?.() } catch { /* noop */ } },
    resume: () => { try { synth.resume(); cb.onResume?.() } catch { /* noop */ } },
    stop: () => { try { synth.cancel() } catch { /* noop */ } cb.onEnd?.() },
  }
}
