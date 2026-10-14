import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Pause, Play, Square, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import { stripMarkdown } from '../../utils/markdown';
import { buildSpeechChunks, resolveVoice, setVoicePref, DEFAULT_VOICES } from '../../utils/speech';

// Lecteur actif (une seule voix à la fois dans toute l'application)
let activeReader = null;

// Liste des voix neuronales, chargée une seule fois puis partagée
let voicesPromise = null;
const loadVoices = () => {
  if (!voicesPromise) {
    voicesPromise = api.getTtsVoices().catch((err) => {
      voicesPromise = null; // Réessayer à la prochaine lecture
      throw err;
    });
  }
  return voicesPromise;
};

// Code de langue complet pour la voix du navigateur (ex : 'fr' -> 'fr-FR')
const browserLang = (lang) => DEFAULT_VOICES[lang]?.split('-').slice(0, 2).join('-') || lang;

// Secours : voix intégrée au navigateur, morceau par morceau
const speakWithBrowser = (chunks, reader, onDone) => {
  const synth = window.speechSynthesis;
  if (!synth) return onDone();
  reader.engine = 'browser';
  const speakAt = (index) => {
    if (reader.cancelled) return;
    if (index >= chunks.length) return onDone();
    const utterance = new SpeechSynthesisUtterance(chunks[index].text);
    utterance.lang = browserLang(chunks[index].lang);
    utterance.onend = () => speakAt(index + 1);
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') speakAt(index + 1);
    };
    synth.speak(utterance);
  };
  speakAt(0);
};

export default function ReadAloudButton({ text = '' }) {
  const { t, lang: uiLang } = useLanguage();
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'playing' | 'paused'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null); // { langs, voices }
  const readerRef = useRef(null);

  // Arrêter la lecture si la fiche est fermée
  useEffect(() => () => readerRef.current?.stop(), []);

  if (!stripMarkdown(text)) return null;

  const startReader = () => {
    activeReader?.stop();
    const reader = {
      cancelled: false,
      paused: false,
      engine: 'neural',
      audio: null,
      controller: new AbortController(),
      urls: [],
      stop: () => {
        reader.cancelled = true;
        reader.controller.abort();
        reader.audio?.pause();
        if (reader.engine === 'browser') window.speechSynthesis?.cancel();
        reader.urls.forEach((url) => URL.revokeObjectURL(url));
        if (activeReader === reader) activeReader = null;
        if (readerRef.current === reader) {
          readerRef.current = null;
          setStatus('idle');
        }
      },
    };
    activeReader = reader;
    readerRef.current = reader;
    return reader;
  };

  // Lit une liste de morceaux avec les voix neuronales ; bascule sur la voix du navigateur en cas d'échec
  const playChunks = async (chunks, reader, voiceOverride = null) => {
    const finish = () => reader.stop();
    let voices = null;
    try {
      voices = await loadVoices();
    } catch {
      // Service indisponible : voix du navigateur
    }
    if (reader.cancelled) return;
    if (!voices) {
      setStatus('playing');
      return speakWithBrowser(chunks, reader, finish);
    }

    const pending = new Map(); // index -> Promise<objectURL> (préchargement du morceau suivant)
    const fetchChunk = (index) => {
      if (!pending.has(index)) {
        const { text: chunkText, lang } = chunks[index];
        const voice = voiceOverride || resolveVoice(lang, voices);
        pending.set(
          index,
          api.synthesizeSpeech(chunkText, voice, reader.controller.signal).then((blob) => {
            const url = URL.createObjectURL(blob);
            reader.urls.push(url);
            return url;
          })
        );
      }
      return pending.get(index);
    };

    const audio = new Audio();
    reader.audio = audio;

    const playAt = async (index) => {
      if (reader.cancelled) return;
      if (index >= chunks.length) return finish();
      try {
        const url = await fetchChunk(index);
        if (reader.cancelled) return;
        if (index + 1 < chunks.length) fetchChunk(index + 1).catch(() => {});
        audio.src = url;
        audio.onended = () => playAt(index + 1);
        // En pause pendant le chargement : le morceau démarrera à la reprise
        if (!reader.paused) {
          await audio.play();
          setStatus('playing');
        }
      } catch (err) {
        if (reader.cancelled || err.name === 'AbortError') return;
        console.warn('[TTS] Voix neuronale indisponible, bascule sur la voix du navigateur :', err.message);
        setStatus('playing');
        speakWithBrowser(chunks.slice(index), reader, finish);
      }
    };
    playAt(0);
  };

  const play = async () => {
    const reader = startReader();
    setStatus('loading');
    const chunks = await buildSpeechChunks(text);
    if (!reader.cancelled) playChunks(chunks, reader);
  };

  const togglePause = () => {
    const reader = readerRef.current;
    if (!reader) return;
    const isBrowser = reader.engine === 'browser';
    reader.paused = status === 'playing';
    if (status === 'playing') {
      if (isBrowser) window.speechSynthesis.pause();
      else reader.audio?.pause();
      setStatus('paused');
    } else {
      if (isBrowser) window.speechSynthesis.resume();
      else reader.audio?.play();
      setStatus('playing');
    }
  };

  // --- Choix de la voix / de l'accent ---
  const openSettings = async () => {
    setIsSettingsOpen(true);
    if (settings) return;
    try {
      const [chunks, voices] = await Promise.all([buildSpeechChunks(text), loadVoices()]);
      const langs = [...new Set(chunks.map((c) => c.lang))];
      setSettings({ langs, voices, chunks });
    } catch {
      setSettings({ error: true });
    }
  };

  const changeVoice = (lang, voice) => {
    setVoicePref(lang, voice);
    setSettings((prev) => ({ ...prev })); // Re-rendu pour refléter le nouveau choix
  };

  const previewVoice = (lang) => {
    const sample = settings.chunks.find((c) => c.lang === lang)?.text.slice(0, 160) || '';
    const reader = startReader();
    setStatus('loading');
    playChunks([{ text: sample, lang }], reader, resolveVoice(lang, settings.voices));
  };

  const regionName = (locale) => {
    const [, region, ...variant] = locale.split('-');
    let label = region;
    try {
      label = new Intl.DisplayNames([uiLang], { type: 'region' }).of(region) || region;
    } catch {
      // Intl.DisplayNames non pris en charge : garder le code de région
    }
    return variant.length ? `${label} (${variant.join(' ')})` : label;
  };

  const languageName = (lang) => {
    try {
      const name = new Intl.DisplayNames([uiLang], { type: 'language' }).of(lang);
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return lang;
    }
  };

  const buttonClass =
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer';

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {status === 'idle' || status === 'loading' ? (
        <button
          type="button"
          onClick={play}
          disabled={status === 'loading'}
          className={`${buttonClass} bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 disabled:cursor-wait`}
          title={t('read_aloud')}
        >
          {status === 'loading' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
          <span>{status === 'loading' ? t('preparing_reading') : t('read_aloud')}</span>
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={togglePause}
            className={`${buttonClass} bg-amber-500 hover:bg-amber-600 text-white border-amber-500`}
            title={status === 'playing' ? t('pause_reading') : t('resume_reading')}
          >
            {status === 'playing' ? (
              <>
                <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
                  <span className="w-[2px] bg-white rounded-full animate-[speak_0.9s_ease-in-out_infinite]" />
                  <span className="w-[2px] bg-white rounded-full animate-[speak_0.9s_ease-in-out_0.15s_infinite]" />
                  <span className="w-[2px] bg-white rounded-full animate-[speak_0.9s_ease-in-out_0.3s_infinite]" />
                </span>
                <Pause className="w-3.5 h-3.5" />
                <span>{t('pause_reading')}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{t('resume_reading')}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => readerRef.current?.stop()}
            className={`${buttonClass} bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700`}
            title={t('stop_reading')}
          >
            <Square className="w-3 h-3" />
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => (isSettingsOpen ? setIsSettingsOpen(false) : openSettings())}
        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        title={t('voice_settings')}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
      </button>

      {isSettingsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-2rem)] z-50 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 p-3 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-stone-800 dark:text-stone-100">{t('voice_settings')}</span>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-sm cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {!settings ? (
              <div className="flex items-center gap-2 py-2 text-stone-500 dark:text-stone-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('preparing_reading')}</span>
              </div>
            ) : settings.error ? (
              <p className="py-1 text-stone-500 dark:text-stone-400">{t('voices_unavailable')}</p>
            ) : (
              <div className="space-y-3">
                {settings.langs.map((lang) => {
                  const options = settings.voices
                    .filter((v) => v.locale.startsWith(`${lang}-`))
                    .sort((a, b) => a.locale.localeCompare(b.locale) || a.name.localeCompare(b.name));
                  const current = resolveVoice(lang, settings.voices);
                  return (
                    <div key={lang}>
                      <label className="block mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        {languageName(lang)}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={current || ''}
                          onChange={(e) => changeVoice(lang, e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                        >
                          {options.map((v) => (
                            <option key={v.shortName} value={v.shortName}>
                              {v.name} · {regionName(v.locale)} · {v.gender === 'Female' ? '♀' : '♂'}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => previewVoice(lang)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 cursor-pointer"
                          title={t('preview_voice')}
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-snug">{t('voice_settings_hint')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
