'use client';

import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Send, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AtlasState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'muted';
type Language = 'en' | 'km';

interface TranscriptEntry {
  id: string;
  role: 'child' | 'atlas';
  text: string;
  source?: string;
}

const STATE_COLORS: Record<AtlasState, { globe: string; glow: string; label: string }> = {
  idle: { globe: '#3aa0ff', glow: 'rgba(58,160,255,0.35)', label: 'Sleeping — tap the mic or type to wake me' },
  listening: { globe: '#43e6ff', glow: 'rgba(67,230,255,0.55)', label: 'Listening…' },
  thinking: { globe: '#ffb648', glow: 'rgba(255,182,72,0.5)', label: 'Thinking…' },
  speaking: { globe: '#4ade80', glow: 'rgba(74,222,128,0.5)', label: 'Speaking' },
  muted: { globe: '#ff5a52', glow: 'rgba(255,90,82,0.4)', label: 'Microphone muted' },
};

const QUICK_PHRASES: { label: string; text: string; lang: Language }[] = [
  { label: '“Hello Atlas!”', text: 'Hello Atlas!', lang: 'en' },
  { label: '“What is 7 plus 5?”', text: 'What is 7 plus 5?', lang: 'en' },
  { label: '“សួស្តី Atlas!”', text: 'សួស្តី Atlas!', lang: 'km' },
  { label: '“៥ បូក ៣ ស្មើប៉ុន្មាន?”', text: '៥ បូក ៣ ស្មើប៉ុន្មាន?', lang: 'km' },
];

/* Minimal typings for the Web Speech API (not in lib.dom for all targets). */
interface SpeechRecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function AtlasFigure({ state }: { state: AtlasState }) {
  const { globe, glow } = STATE_COLORS[state];
  const eyesClosed = state === 'idle' || state === 'muted';

  return (
    <svg viewBox="0 0 360 460" className="h-[320px] w-auto sm:h-[400px]" aria-label={`Atlas is ${state}`}>
      <defs>
        <radialGradient id="atlasGlobe" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="45%" stopColor={globe} />
          <stop offset="100%" stopColor={globe} stopOpacity="0.7" />
        </radialGradient>
        <linearGradient id="atlasBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f2efe9" />
          <stop offset="100%" stopColor="#d8d3c8" />
        </linearGradient>
      </defs>

      {/* globe glow */}
      <circle cx="180" cy="105" r="92" fill={glow} className={state === 'thinking' ? 'animate-pulse' : ''} />

      {/* arms */}
      <path d="M 108 268 C 88 230 92 202 116 182" fill="none" stroke="#d8d3c8" strokeWidth="24" strokeLinecap="round" />
      <path d="M 252 268 C 272 230 268 202 244 182" fill="none" stroke="#e8e4dc" strokeWidth="24" strokeLinecap="round" />

      {/* globe */}
      <circle cx="180" cy="105" r="62" fill="url(#atlasGlobe)" className={state === 'speaking' ? 'animate-pulse' : ''} />
      <ellipse cx="180" cy="105" rx="62" ry="24" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />
      <ellipse cx="180" cy="105" rx="24" ry="62" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />
      <ellipse cx="160" cy="82" rx="16" ry="9" fill="#ffffff" opacity="0.55" />

      {/* LED collar */}
      <ellipse cx="180" cy="172" rx="36" ry="10" fill="#1d2330" />
      {[148, 162, 180, 198, 212].map((x, i) => (
        <circle key={x} cx={x} cy={172 + (i === 0 || i === 4 ? 0 : 3)} r="3" fill={globe} />
      ))}

      {/* body */}
      <path
        d="M 100 440 L 100 270 C 100 208 132 180 180 180 C 228 180 260 208 260 270 L 260 440 Z"
        fill="url(#atlasBody)"
      />

      {/* face panel */}
      <rect x="122" y="212" width="116" height="68" rx="34" fill="#2b313d" />
      {/* eyes */}
      {eyesClosed ? (
        <g stroke="#5fe3ff" strokeWidth="4" strokeLinecap="round">
          <path d="M 144 246 q 10 8 22 0" fill="none" />
          <path d="M 194 246 q 10 8 22 0" fill="none" />
        </g>
      ) : (
        <g fill="#5fe3ff">
          <circle cx="155" cy="244" r="11" />
          <circle cx="205" cy="244" r="11" />
          <circle cx="151" cy="240" r="4" fill="#ffffff" />
          <circle cx="201" cy="240" r="4" fill="#ffffff" />
        </g>
      )}
      {/* blush */}
      <ellipse cx="132" cy="262" rx="7" ry="4" fill="#ff9d8a" opacity="0.5" />
      <ellipse cx="228" cy="262" rx="7" ry="4" fill="#ff9d8a" opacity="0.5" />

      {/* mic holes */}
      <g fill="#9a948a">
        {[160, 173, 187, 200].map((x) => (
          <circle key={x} cx={x} cy="298" r="2.5" />
        ))}
      </g>

      {/* speaker grille */}
      <g fill="#b5afa3">
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <circle key={`${row}-${col}`} cx={157 + col * 16 + (row % 2) * 8} cy={330 + row * 14} r="3" />
          )),
        )}
      </g>

      {/* base */}
      <path d="M 92 440 L 268 440 L 260 414 C 230 404 130 404 100 414 Z" fill="#3a4150" />
      <rect x="90" y="434" width="180" height="8" rx="4" fill="#1d222d" />
    </svg>
  );
}

export default function AtlasDemoPage() {
  const [state, setState] = useState<AtlasState>('idle');
  const [language, setLanguage] = useState<Language>('en');
  const [input, setInput] = useState('');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsNote, setTtsNote] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stateRef = useRef<AtlasState>('idle');
  stateRef.current = state;

  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null);
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, lang: Language) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setState('idle');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = lang === 'km' ? 'km' : 'en';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.toLowerCase().startsWith(targetLang));

    if (voice) {
      utterance.voice = voice;
      setTtsNote(null);
    } else if (lang === 'km') {
      setTtsNote(
        'No Khmer text-to-speech voice is installed in this browser, so Atlas answers in Khmer text. The real toy ships with its own Khmer voice.',
      );
    }

    utterance.lang = lang === 'km' ? 'km-KH' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.15;
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');
    setState('speaking');
    window.speechSynthesis.speak(utterance);
  }, []);

  const askAtlas = useCallback(
    async (text: string) => {
      const message = text.trim();

      if (!message || stateRef.current === 'thinking') {
        return;
      }

      setInput('');
      setTranscript((current) => [
        ...current,
        { id: `child-${Date.now()}`, role: 'child', text: message },
      ]);
      setState('thinking');

      try {
        const response = await fetch('/api/atlas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, language }),
        });
        const data = (await response.json()) as {
          answer?: string;
          source?: string;
          language?: Language;
        };
        const answer = data.answer ?? 'Sorry, I could not answer that right now.';

        setTranscript((current) => [
          ...current,
          { id: `atlas-${Date.now()}`, role: 'atlas', text: answer, source: data.source },
        ]);
        speak(answer, data.language ?? language);
      } catch {
        setTranscript((current) => [
          ...current,
          {
            id: `atlas-${Date.now()}`,
            role: 'atlas',
            text: 'I could not reach my brain right now. Please try again.',
            source: 'error',
          },
        ]);
        setState('idle');
      }
    },
    [language, speak],
  );

  const startListening = useCallback(() => {
    const Recognition = getSpeechRecognition();

    if (!Recognition) {
      return;
    }

    window.speechSynthesis?.cancel();
    const recognition = new Recognition();
    recognition.lang = language === 'km' ? 'km-KH' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const heard = event.results[0]?.[0]?.transcript ?? '';

      if (heard) {
        void askAtlas(heard);
      }
    };
    recognition.onerror = () => setState('idle');
    recognition.onend = () => {
      if (stateRef.current === 'listening') {
        setState('idle');
      }
    };
    recognitionRef.current = recognition;
    setState('listening');
    recognition.start();
  }, [language, askAtlas]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState('idle');
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void askAtlas(input);
  };

  const { label } = STATE_COLORS[state];

  return (
    <main className="min-h-screen bg-[#0c1226] pb-16 pt-24 text-white">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Atlas Live Demo</h1>
          <p className="mt-2 text-sm text-slate-400">
            Talk to the Atlas smart-toy brain in English or Khmer — by voice or by typing.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr]">
          {/* character + controls */}
          <div className="flex flex-col items-center">
            <AtlasFigure state={state} />
            <p className="mt-3 h-5 text-sm text-slate-300">{label}</p>

            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
                className={language !== 'en' ? 'border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white' : ''}
              >
                English
              </Button>
              <Button
                type="button"
                variant={language === 'km' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('km')}
                className={language !== 'km' ? 'border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white' : ''}
              >
                ខ្មែរ (Khmer)
              </Button>
            </div>

            <div className="mt-4">
              {state === 'listening' ? (
                <Button type="button" size="lg" variant="destructive" onClick={stopListening} className="h-16 w-16 rounded-full">
                  <MicOff className="h-7 w-7" />
                  <span className="sr-only">Stop listening</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={startListening}
                  disabled={!speechSupported || state === 'thinking' || state === 'speaking'}
                  className="h-16 w-16 rounded-full"
                >
                  <Mic className="h-7 w-7" />
                  <span className="sr-only">Start listening</span>
                </Button>
              )}
            </div>
            {!speechSupported ? (
              <p className="mt-3 max-w-[280px] text-center text-xs text-amber-300">
                This browser has no speech recognition — use the text box instead (Chrome or Edge recommended for voice).
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Mic language: {language === 'km' ? 'km-KH' : 'en-US'}
              </p>
            )}
          </div>

          {/* conversation */}
          <div className="flex min-h-[420px] flex-col rounded-xl border border-slate-700 bg-slate-900/60">
            <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-3 text-sm text-slate-300">
              <Volume2 className="h-4 w-4" />
              Conversation
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {transcript.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Say or type something — try a quick phrase below. Atlas answers in the language you use.
                </p>
              ) : (
                transcript.map((entry) => (
                  <div key={entry.id} className={`flex ${entry.role === 'child' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                        entry.role === 'child' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-100'
                      }`}
                    >
                      {entry.text}
                      {entry.role === 'atlas' && entry.source ? (
                        <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                          {entry.source}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
              {state === 'thinking' ? (
                <div className="flex items-center gap-2 text-sm text-amber-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Atlas is thinking…
                </div>
              ) : null}
            </div>

            {ttsNote ? <p className="px-4 pb-2 text-xs text-amber-300">{ttsNote}</p> : null}

            <div className="border-t border-slate-700 p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                {QUICK_PHRASES.map((phrase) => (
                  <button
                    key={phrase.text}
                    type="button"
                    onClick={() => {
                      setLanguage(phrase.lang);
                      void askAtlas(phrase.text);
                    }}
                    className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 transition hover:border-sky-400 hover:text-white"
                  >
                    {phrase.label}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={language === 'km' ? 'សរសេរសារជាភាសាខ្មែរ ឬអង់គ្លេស...' : 'Type to Atlas in English or Khmer...'}
                  className="h-10 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500"
                  disabled={state === 'thinking'}
                />
                <Button type="submit" size="icon" className="h-10 w-10" disabled={state === 'thinking' || !input.trim()}>
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Concept demo of the Atlas smart tabletop toy — see docs/atlas-toy-design.md. Voice input uses your
          browser&apos;s speech recognition; the production toy uses on-device wake word and far-field microphones.
        </p>
      </div>
    </main>
  );
}
