import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { trpc } from '@/providers/trpc';
import SmileyButton from '@/components/SmileyButton';
import ConfirmationCard from '@/components/ConfirmationCard';

type EmotionType = 'groen' | 'oranje' | 'rood';
type AppState = 'select-name' | 'checkin' | 'confirmation';

const AUTO_RESET_SECONDS = 30;

interface EmotionOption {
  emotion: EmotionType;
  emoji: string;
  label: string;
  color: string;
}

const emotions: EmotionOption[] = [
  { emotion: 'groen', emoji: '\uD83D\uDE0A', label: 'Alles is goed', color: '#27AE60' },
  { emotion: 'oranje', emoji: '\uD83D\uDE10', label: 'Het gaat wel', color: '#F39C12' },
  { emotion: 'rood', emoji: '\uD83D\uDE22', label: 'Ik voel me niet goed', color: '#E74C3C' },
];

export default function Home() {
  const [appState, setAppState] = useState<AppState>('select-name');
  const [selectedName, setSelectedName] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [timeLeft, setTimeLeft] = useState(AUTO_RESET_SECONDS);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
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
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );
    }
    if (subtextRef.current) {
      gsap.fromTo(
        subtextRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.4 }
      );
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
      if (resetTimerRef.current) {
        clearInterval(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    }
    return () => {
      if (resetTimerRef.current) clearInterval(resetTimerRef.current);
    };
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
    <div
      style={{
        minHeight: '100dvh',
        background: '#F5F1ED',
        fontFamily: 'Inter, sans-serif',
        overflowY: 'auto',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* STEP 1: SELECT NAME */}
        {appState === 'select-name' && (
          <>
            <h1
              ref={headingRef}
              style={{
                fontSize: 'clamp(40px, 6vw, 64px)',
                fontWeight: 700,
                fontFamily: 'Poppins, sans-serif',
                color: '#0B193D',
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              Wie ben je?
            </h1>
            <p
              ref={subtextRef}
              style={{
                fontSize: 18,
                color: '#29445A',
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              Kies je naam uit de lijst.
            </p>

            {participantsQuery.isLoading ? (
              <p style={{ marginTop: 40, color: '#29445A' }}>Namen laden...</p>
            ) : participants.length === 0 ? (
              <p style={{ marginTop: 40, textAlign: 'center', color: '#29445A' }}>
                Nog geen deelnemers toegevoegd.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 12,
                  width: '100%',
                  marginTop: 32,
                }}
              >
                {participants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleNameSelect(p.name)}
                    style={{
                      padding: '16px 12px',
                      borderRadius: 16,
                      border: '2px solid #E6EDE8',
                      background: '#FFFFFF',
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#0B193D',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0B193D';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E6EDE8';
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP 2: SELECT EMOTION */}
        {appState === 'checkin' && (
          <>
            <button
              onClick={() => { setAppState('select-name'); setSelectedName(''); }}
              style={{
                fontSize: 14,
                color: '#29445A',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 16,
              }}
            >
              &larr; Terug naar naamkeuze
            </button>

            <h1
              style={{
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 700,
                fontFamily: 'Poppins, sans-serif',
                color: '#0B193D',
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              Hoe voel je je, {selectedName}?
            </h1>
            <p
              style={{
                fontSize: 16,
                color: '#29445A',
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              Kies het smiley dat past bij hoe je je voelt.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 24,
                marginTop: 40,
              }}
            >
              {emotions.map((e) => (
                <SmileyButton
                  key={e.emotion}
                  emotion={e.emotion}
                  emoji={e.emoji}
                  label={e.label}
                  color={e.color}
                  onClick={() => handleEmotionSelect(e.emotion)}
                />
              ))}
            </div>
          </>
        )}

        {/* STEP 3: CONFIRMATION */}
        {appState === 'confirmation' && selectedEmotion && (
          <ConfirmationCard
            emotion={selectedEmotion}
            participantName={selectedName}
            onReset={handleReset}
            timeLeft={timeLeft}
            totalSeconds={AUTO_RESET_SECONDS}
          />
        )}
      </div>
    </div>
  );
}
