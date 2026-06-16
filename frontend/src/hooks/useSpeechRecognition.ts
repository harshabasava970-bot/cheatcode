import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalTranscript: (transcript: string) => void;
  silenceThreshold?: number; // ms of silence before submitting
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
}

// Web Speech API types (not yet in standard TS lib)
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

// Augment window type for cross-browser speech recognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition({
  onFinalTranscript,
  silenceThreshold = 2000,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedTranscriptRef = useRef('');
  const isListeningRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      const text = accumulatedTranscriptRef.current.trim();
      if (text.length > 0) {
        setTranscript(text);
        setInterimTranscript('');
        onFinalTranscript(text);
        accumulatedTranscriptRef.current = '';
        setTranscript('');
      }
    }, silenceThreshold);
  }, [clearSilenceTimer, onFinalTranscript, silenceThreshold]);

  const setupRecognition = useCallback((): SpeechRecognitionInstance | null => {
    if (!isSupported) return null;

    const SpeechRecognitionAPI: SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        accumulatedTranscriptRef.current += ' ' + final;
        accumulatedTranscriptRef.current = accumulatedTranscriptRef.current.trim();
        setTranscript(accumulatedTranscriptRef.current);
        resetSilenceTimer();
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMap: Record<string, string> = {
        'no-speech': 'No speech detected. Please speak clearly.',
        'audio-capture': 'Microphone not accessible. Check browser permissions.',
        'not-allowed': 'Microphone permission denied. Allow access in browser settings.',
        'network': 'Network error during speech recognition.',
        'aborted': '',
      };
      const msg = errorMap[event.error] || `Speech recognition error: ${event.error}`;
      if (msg) setError(msg);
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started or other error, ignore
        }
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [isSupported, resetSilenceTimer]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    setError(null);
    accumulatedTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');

    const recognition = setupRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    setIsListening(true);

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Failed to start microphone. Please try again.');
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [isSupported, setupRecognition]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    clearSilenceTimer();

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);
    setInterimTranscript('');

    // Submit any remaining transcript
    const remaining = accumulatedTranscriptRef.current.trim();
    if (remaining.length > 0) {
      onFinalTranscript(remaining);
      accumulatedTranscriptRef.current = '';
      setTranscript('');
    }
  }, [clearSilenceTimer, onFinalTranscript]);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      clearSilenceTimer();
      recognitionRef.current?.stop();
    };
  }, [clearSilenceTimer]);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    isSupported,
    error,
  };
}
