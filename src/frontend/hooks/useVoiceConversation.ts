import { useEffect, useRef, useState } from 'react'
import type { VoiceTranscriptSource } from '../../shared/types'

type SpeechRecognitionResultAlternativeLike = {
  transcript: string
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionResultAlternativeLike
}

type SpeechRecognitionEventLike = Event & {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onerror: ((event: Event & { error?: string }) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type ReadyVoiceTurn = {
  transcript: string
  durationMs: number | null
  source: VoiceTranscriptSource
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function getSpeechSynthesisSupport() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  )
}

export function useVoiceConversation(silenceMs = 4000) {
  const recognitionConstructor = getSpeechRecognitionConstructor()
  const isSpeechSupported = getSpeechSynthesisSupport()
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const silenceTimeoutRef = useRef<number | null>(null)
  const transcriptRef = useRef('')
  const startedAtRef = useRef<number | null>(null)
  const isListeningRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const isConversationActiveRef = useRef(false)
  const suppressRestartRef = useRef(false)

  const [isConversationActive, setIsConversationActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscriptState] = useState('')
  const [durationMs, setDurationMs] = useState<number | null>(null)
  const [readyTurn, setReadyTurn] = useState<ReadyVoiceTurn | null>(null)
  const [error, setError] = useState<string | null>(null)

  function clearSilenceTimeout() {
    if (silenceTimeoutRef.current !== null) {
      window.clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
  }

  function setTranscript(value: string) {
    transcriptRef.current = value
    setTranscriptState(value)
  }

  function stopRecognition() {
    recognitionRef.current?.stop()
  }

  function speakText(text: string, onComplete?: () => void) {
    const cleaned = text.trim()
    if (!cleaned) {
      onComplete?.()
      return
    }

    clearSilenceTimeout()
    suppressRestartRef.current = true

    if (isListeningRef.current) {
      stopRecognition()
    }

    if (!isSpeechSupported) {
      suppressRestartRef.current = false
      onComplete?.()
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(cleaned)
    utterance.rate = 1
    utterance.pitch = 1

    utterance.onstart = () => {
      isSpeakingRef.current = true
      setIsSpeaking(true)
    }

    const finishSpeech = () => {
      isSpeakingRef.current = false
      setIsSpeaking(false)
      suppressRestartRef.current = false
      onComplete?.()
    }

    utterance.onend = finishSpeech
    utterance.onerror = finishSpeech
    window.speechSynthesis.speak(utterance)
  }

  function finalizeTurn(source: VoiceTranscriptSource) {
    const nextTranscript = transcriptRef.current.trim()
    clearSilenceTimeout()

    if (!nextTranscript) {
      return
    }

    const nextDuration = startedAtRef.current ? Date.now() - startedAtRef.current : durationMs
    setDurationMs(nextDuration)
    setReadyTurn({
      transcript: nextTranscript,
      durationMs: nextDuration,
      source,
    })
    suppressRestartRef.current = true
    stopRecognition()
  }

  function scheduleSilenceWindow() {
    clearSilenceTimeout()
    silenceTimeoutRef.current = window.setTimeout(() => {
      finalizeTurn('browser')
    }, silenceMs)
  }

  function startListening() {
    if (!recognitionConstructor) {
      setError('Speech recognition is not available in this browser.')
      return
    }

    if (isListeningRef.current || isSpeakingRef.current) {
      return
    }

    const recognition = new recognitionConstructor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      isListeningRef.current = true
      setIsListening(true)
      setTranscript('')
      setDurationMs(null)
      setError(null)
      startedAtRef.current = Date.now()
    }

    recognition.onresult = (event) => {
      let nextTranscript = ''
      for (let index = 0; index < event.results.length; index += 1) {
        nextTranscript += event.results[index][0]?.transcript ?? ''
      }

      const cleaned = nextTranscript.trim()
      setTranscript(cleaned)

      if (cleaned) {
        scheduleSilenceWindow()
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'aborted') {
        return
      }

      if (event.error === 'no-speech') {
        setError('No speech detected. Try answering again.')
        return
      }

      setError(event.error ? `Voice capture failed: ${event.error}.` : 'Voice capture failed.')
    }

    recognition.onend = () => {
      recognitionRef.current = null
      isListeningRef.current = false
      setIsListening(false)

      if (startedAtRef.current) {
        setDurationMs(Date.now() - startedAtRef.current)
      }

      if (suppressRestartRef.current) {
        suppressRestartRef.current = false
        return
      }

      const hasTranscript = Boolean(transcriptRef.current.trim())
      if (
        isConversationActiveRef.current &&
        !isSpeakingRef.current &&
        !hasTranscript &&
        recognitionConstructor
      ) {
        startListening()
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    clearSilenceTimeout()
    suppressRestartRef.current = true
    stopRecognition()
  }

  function startConversation() {
    isConversationActiveRef.current = true
    setIsConversationActive(true)
    setError(null)
  }

  function stopConversation() {
    isConversationActiveRef.current = false
    setIsConversationActive(false)
    clearSilenceTimeout()
    suppressRestartRef.current = true
    stopRecognition()
    if (isSpeechSupported) {
      window.speechSynthesis.cancel()
    }

    isSpeakingRef.current = false
    setIsSpeaking(false)
  }

  function clearTranscript() {
    setTranscript('')
    setDurationMs(null)
  }

  function clearReadyTurn() {
    setReadyTurn(null)
  }

  useEffect(() => {
    return () => {
      isConversationActiveRef.current = false
      clearSilenceTimeout()
      recognitionRef.current?.stop()
      if (isSpeechSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSpeechSupported])

  return {
    isRecognitionSupported: Boolean(recognitionConstructor),
    isSpeechSupported,
    silenceMs,
    isConversationActive,
    isListening,
    isSpeaking,
    transcript,
    durationMs,
    readyTurn,
    error,
    setTranscript,
    startConversation,
    stopConversation,
    startListening,
    stopListening,
    finalizeManualTurn: () => finalizeTurn(isListeningRef.current ? 'browser' : 'manual'),
    speakText,
    clearTranscript,
    clearReadyTurn,
  }
}
