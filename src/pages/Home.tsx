import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { trpc } from '@/providers/trpc';
import SmileyButton from '@/components/SmileyButton';
import ConfirmationCard from '@/components/ConfirmationCard';

type EmotionType = 'groen' | 'oranje' | 'rood';
type AppState = 'select-name' | 'checkin' | 'confirmation';

const AUTO_RESET_SECONDS = 30;

const emotions = [
  { emotion: 'groen' as EmotionType, emoji: '\uD83D\uDE0A', label: 'Alles is goed', color: '#27AE60' },
  { emotion: 'oranje' as EmotionType, emoji: '\uD83D\uDE10', label: 'Het gaat wel', color: '#F39C12' },
  { emotion: 'rood' as EmotionType, emoji: '\uD83D\uDE22', label: 'Ik voel me niet goed', color: '#E74C3C' },
];

export default function Home() {
  const [appState, setAppState] = useState<AppState>('select-name');
  const [selectedName, setSelectedName] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [timeLeft, setTimeLeft] = useState(AUTO_RESET_SECONDS);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const utils = trpc.useUtils();
  const participantsQuery = trpc.participant.listActive.useQuery();
  const createEmotion = trpc.emotion.create.useMutation({
    onSuccess: () => {
      utils.emotion.listToday.invalidate();
      utils.emotion.getStats.invalidate();
    },
  });

  useEffect(() => {
    if (headingRef.current) {
      gsap.fromTo(headingRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
    }
  }, [appState]);

  useEffect(() => {
    if (appState === 'confirmation') {
      setTimeLeft(AUTO_RESET_SECONDS);
      resetTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setAppState('select-name');
            setSelectedEmotion(null);
            setSelectedName('');
            return AUTO_RESET_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (resetTimerRef.current) clearInterval(resetTimerRef.current);
    }
    return () => { if (resetTimerRef.current) clearInterval(resetTimerRef.current); };
  }, [appState]);

  const handleNameSelect = useCallback((name: string) => {
    setSelectedName(name);
    setAppState('checkin');
  }, []);

  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    createEmotion.mutate({ emotion, participantName: selectedName });
    setSelectedEmotion(emotion);
    setAppState('confirmation');
  }, [createEmotion, selectedName]);

  const handleReset = useCallback(() => {
    setAppState('select-name');
    setSelectedEmotion(null);
    setSelectedName('');
  }, []);

  const participants = participantsQuery.data ?? [];

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      {/* STEP 1: SELECT NAME */}
      {appState === 'select-name' && (
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1
            ref={headingRef}
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: '#0B193D', textAlign: 'center' }}
          >
            Wie ben je?
          </h1>
          <p style={{ fontSize: 18, color: '#29445A', textAlign: 'center', marginTop: 12, marginBottom: 32 }}>
            Kies je naam uit de lijst.
          </p>

          {participantsQuery.isLoading ? (
            <p style={{ color: '#29445A' }}>Namen laden...</p>
          ) : participants.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#29445A' }}>
              Nog geen deelnemers toegevoegd.
            </p>
          ) : (
            <select
              defaultValue=""
              onChange={(e) => { if (e.target.value) handleNameSelect(e.target.value); }}
              style={{
                width: '100%',
                maxWidth: 400,
                height: 56,
                fontSize: 18,
                borderRadius: 16,
                border: '2px solid #E6EDE8',
                background: '#FFFFFF',
                color: '#0B193D',
                padding: '0 20px',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%230B193D' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                backgroundSize: 20,
              }}
            >
              <option value="" disabled>Kies je naam...</option>
              {participants.map((p) => (
                <option key={p.id} value={p.name} style={{ fontSize: 16, padding: '12px 16px' }}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* STEP 2: SELECT EMOTION */}
      {appState === 'checkin' && (
        <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={() => { setAppState('select-name'); setSelectedName(''); }}
            style={{ fontSize: 14, color: '#29445A', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}
          >
            &larr; Terug naar naamkeuze
          </button>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: '#0B193D', textAlign: 'center' }}>
            Hoe voel je je, {selectedName}?
          </h1>
          <p style={{ fontSize: 16, color: '#29445A', textAlign: 'center', marginTop: 8, marginBottom: 40 }}>
            Kies het smiley dat past bij hoe je je voelt.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 }}>
            {emotions.map((e) => (
              <SmileyButton key={e.emotion} emotion={e.emotion} emoji={e.emoji} label={e.label} color={e.color} onClick={() => handleEmotionSelect(e.emotion)} />
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: CONFIRMATION */}
      {appState === 'confirmation' && selectedEmotion && (
        <ConfirmationCard emotion={selectedEmotion} participantName={selectedName} onReset={handleReset} timeLeft={timeLeft} totalSeconds={AUTO_RESET_SECONDS} />
      )}
    </div>
  );
}
