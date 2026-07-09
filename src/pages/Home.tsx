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
  { emotion: 'groen', emoji: '😊', label: 'Alles is goed', color: '#27AE60' },
  { emotion: 'oranje', emoji: '😐', label: 'Het gaat wel', color: '#F39C12' },
  { emotion: 'rood', emoji: '😢', label: 'Ik voel me niet goed', color: '#E74C3C' },
];

export default function Home() {
  const [appState, setAppState] = useState<AppState>('select-name');
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [timeLeft, setTimeLeft] = useState(AUTO_RESET_SECONDS);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const participantGridRef = useRef<HTMLDivElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const utils = trpc.useUtils();
  const participantsQuery = trpc.participant.listActive.useQuery();
  const createEmotion = trpc.emotion.create.useMutation({
    onSuccess: () => {
      utils.emotion.listToday.invalidate();
      utils.emotion.getStats.invalidate();
    },
  });

  // Entrance animations
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

  // Auto-reset timer
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

  const handleBackToNameSelection = useCallback(() => {
    setAppState('select-name');
    setSelectedName('');
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
  const isLoadingParticipants = participantsQuery.isLoading;

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-y-auto px-4 py-8">
      {/* STEP 1: SELECT NAME */}
      {appState === 'select-name' && (
        <div className="flex w-full max-w-[640px] flex-col items-center py-8">
          <h1
            ref={headingRef}
            className="cursor-default select-none text-center font-poppins font-bold"
            style={{ fontSize: 'clamp(48px, 6vw, 72px)', color: '#0B193D' }}
          >
            Wie ben je?
          </h1>
          <p
            ref={subtextRef}
            className="mt-4 text-center font-inter"
            style={{ fontSize: 18, color: '#29445A' }}
          >
            Kies je naam uit de lijst.
          </p>

          {isLoadingParticipants ? (
            <p className="mt-8 font-inter" style={{ color: '#29445A' }}>Namen laden...</p>
          ) : participants.length === 0 ? (
            <p className="mt-8 text-center font-inter" style={{ color: '#29445A' }}>
              Nog geen deelnemers toegevoegd.<br />
              <span style={{ fontSize: 14, color: 'rgba(41,68,90,0.6)' }}>
                Ga naar /settings om deelnemers toe te voegen.
              </span>
            </p>
          ) : (
            <div
              ref={participantGridRef}
              className="mt-10 grid w-full grid-cols-2 gap-4"
            >
              {participants.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => handleNameSelect(p.name)}
                  className="flex items-center justify-center rounded-2xl border-2 border-transparent bg-white py-5 px-4 font-inter font-semibold text-[#0B193D] shadow-sm transition-all duration-200 hover:border-[#0B193D] hover:shadow-md active:scale-[0.97]"
                  style={{
                    fontSize: 18,
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: SELECT EMOTION */}
      {appState === 'checkin' && (
        <div className="flex w-full max-w-[720px] flex-col items-center py-8">
          <button
            onClick={handleBackToNameSelection}
            className="mb-6 font-inter transition-colors hover:text-[#0B193D]"
            style={{ fontSize: 14, color: '#29445A' }}
          >
            ← Terug naar naamkeuze
          </button>

          <h1
            className="text-center font-poppins font-bold"
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              color: '#0B193D',
            }}
          >
            Hoe voel je je, {selectedName}?
          </h1>
          <p
            className="mt-4 text-center font-inter"
            style={{ fontSize: 18, color: '#29445A' }}
          >
            Kies het smiley dat past bij hoe je je voelt.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {emotions.map((e) => (
              <SmileyButton
                key={e.emotion}
                emotion={e.emotion}
                emoji={e.emoji}
                label={e.label}
                color={e.color}
                onClick={() => handleEmotionSelect(e.emotion)}
                isVisible={true}
              />
            ))}
          </div>
        </div>
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
  );
}
