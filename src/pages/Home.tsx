import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { Settings } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import SmileyButton from '@/components/SmileyButton';
import ConfirmationCard from '@/components/ConfirmationCard';
import SettingsPanel from '@/components/SettingsPanel';

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
  {
    emotion: 'groen',
    emoji: '😊',
    label: 'Alles is goed',
    color: '#27AE60',
  },
  {
    emotion: 'oranje',
    emoji: '😐',
    label: 'Het gaat wel',
    color: '#F39C12',
  },
  {
    emotion: 'rood',
    emoji: '😢',
    label: 'Ik voel me niet goed',
    color: '#E74C3C',
  },
];

export default function Home() {
  const [appState, setAppState] = useState<AppState>('select-name');
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [staffVisible, setStaffVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(AUTO_RESET_SECONDS);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);
  const participantGridRef = useRef<HTMLDivElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const utils = trpc.useUtils();

  // tRPC queries and mutations
  const participantsQuery = trpc.participant.listActive.useQuery();
  const createEmotion = trpc.emotion.create.useMutation({
    onSuccess: () => {
      utils.emotion.listToday.invalidate();
      utils.emotion.getStats.invalidate();
    },
  });

  // ── STEP 1: Name Selection Animations ──
  useEffect(() => {
    if (appState !== 'select-name') return;

    // Heading entrance
    if (headingRef.current) {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.2 }
      );
    }

    // Subtext entrance
    if (subtextRef.current) {
      gsap.fromTo(
        subtextRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.6 }
      );
    }

    // Participant cards staggered entrance
    if (participantGridRef.current) {
      const cards = participantGridRef.current.querySelectorAll('.participant-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.1,
          delay: 0.4,
        }
      );
    }
  }, [appState]);

  // ── STEP 2: Checkin Animations ──
  useEffect(() => {
    if (appState !== 'checkin') return;

    if (headingRef.current) {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.2 }
      );
    }

    if (subtextRef.current) {
      gsap.fromTo(
        subtextRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 1.4 }
      );
    }
  }, [appState]);

  // Gear icon entrance animation
  useEffect(() => {
    if (gearRef.current && (appState === 'select-name' || appState === 'checkin') && staffVisible) {
      gsap.fromTo(
        gearRef.current,
        { opacity: 0 },
        {
          opacity: 0.3,
          duration: 0.4,
          ease: 'power2.out',
        }
      );
    }
  }, [appState, staffVisible]);

  // Auto-reset timer — goes ALL the way back to Step 1
  useEffect(() => {
    if (appState === 'confirmation') {
      setTimeLeft(AUTO_RESET_SECONDS);

      resetTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Auto-reset to Step 1 (name selection)
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
      if (resetTimerRef.current) {
        clearInterval(resetTimerRef.current);
      }
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
    // Create emotion via tRPC with participant name
    createEmotion.mutate({
      emotion,
      participantName: selectedName,
    });

    setSelectedEmotion(emotion);
    setAppState('confirmation');
  }, [createEmotion, selectedName]);

  const handleReset = useCallback(() => {
    setAppState('select-name');
    setSelectedEmotion(null);
    setSelectedName('');
  }, []);

  const handleHeadingTripleClick = useCallback(() => {
    setStaffVisible(true);
  }, []);

  const participants = participantsQuery.data ?? [];
  const isLoadingParticipants = participantsQuery.isLoading;

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4">
      {/* Settings gear icon — staff only, shown after triple-click */}
      {staffVisible && (appState === 'select-name' || appState === 'checkin') && (
        <button
          ref={gearRef}
          onClick={() => setSettingsOpen(true)}
          className="absolute top-6 right-6 z-20 transition-opacity duration-300 hover:opacity-100 focus:outline-none"
          style={{ opacity: 0.3 }}
          type="button"
          aria-label="Instellingen"
        >
          <Settings size={24} color="#29445A" />
        </button>
      )}

      {/* Settings Panel */}
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* ════════════════════════════════════════════
          STEP 1: SELECT NAME
          ════════════════════════════════════════════ */}
      {appState === 'select-name' && (
        <div className="flex w-full max-w-[640px] flex-col items-center">
          {/* Heading */}
          <h1
            ref={headingRef}
            onClick={handleHeadingTripleClick}
            className="cursor-default select-none text-center font-poppins font-bold"
            style={{
              fontSize: 'clamp(48px, 6vw, 72px)',
              color: '#0B193D',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              marginBottom: 16,
              opacity: 0,
            }}
          >
            Wie ben je?
          </h1>

          {/* Subtext */}
          <p
            ref={subtextRef}
            className="mb-10 text-center font-inter"
            style={{
              fontSize: 18,
              color: '#29445A',
              opacity: 0,
            }}
          >
            Kies je naam uit de lijst.
          </p>

          {/* Loading State */}
          {isLoadingParticipants && (
            <div
              className="flex items-center justify-center rounded-2xl bg-white font-inter"
              style={{
                minHeight: 120,
                width: '100%',
                border: '2px solid #E6EDE8',
                color: '#29445A',
                fontSize: 16,
              }}
            >
              Namen laden...
            </div>
          )}

          {/* Empty State */}
          {!isLoadingParticipants && participants.length === 0 && (
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white"
              style={{
                minHeight: 120,
                width: '100%',
                border: '2px solid #E6EDE8',
                padding: 32,
              }}
            >
              <p
                className="text-center font-inter"
                style={{
                  fontSize: 16,
                  color: '#29445A',
                }}
              >
                Nog geen deelnemers toegevoegd.
              </p>
              <Link
                to="/settings"
                className="font-inter font-semibold transition-colors duration-200 hover:underline"
                style={{
                  fontSize: 16,
                  color: '#0B193D',
                }}
              >
                Ga naar instellingen →
              </Link>
            </div>
          )}

          {/* Participant Cards Grid */}
          {!isLoadingParticipants && participants.length > 0 && (
            <div
              ref={participantGridRef}
              className="grid w-full gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(140px, 45%, 280px), 1fr))',
                maxHeight: 'calc(100dvh - 280px)',
                overflowY: 'auto',
              }}
            >
              {participants.map((participant) => (
                <button
                  key={participant.id}
                  onClick={() => handleNameSelect(participant.name)}
                  className="participant-card flex items-center justify-center rounded-2xl bg-white font-inter font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0B193D] focus-visible:ring-offset-2"
                  style={{
                    minHeight: 120,
                    border: '2px solid #E6EDE8',
                    fontSize: 24,
                    color: '#0B193D',
                    cursor: 'pointer',
                    opacity: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0B193D';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E6EDE8';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  type="button"
                  aria-label={`Kies ${participant.name}`}
                >
                  {participant.name}
                </button>
              ))}
            </div>
          )}

          {/* Hidden triple-click hint for staff */}
          <p
            className="mt-6 text-center font-inter"
            style={{
              fontSize: 12,
              color: '#29445A',
              opacity: 0.15,
              userSelect: 'none',
            }}
          >
            Driemaal klikken op de titel toont instellingen
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════
          STEP 2: EMOTION SELECTION (CHECKIN)
          ════════════════════════════════════════════ */}
      {appState === 'checkin' && (
        <div className="flex flex-col items-center">
          {/* Heading — personalised with selected name */}
          <h1
            ref={headingRef}
            onClick={handleHeadingTripleClick}
            className="cursor-default select-none text-center font-poppins font-bold"
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              color: '#0B193D',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: 800,
              marginBottom: 48,
              opacity: 0,
            }}
          >
            Hoe voel je je{selectedName ? `, ${selectedName}` : ''}?
          </h1>

          {/* Smiley Button Grid */}
          <div className="flex flex-col items-center gap-6 md:flex-row md:gap-12">
            {emotions.map((emotionOpt, index) => (
              <SmileyButton
                key={emotionOpt.emotion}
                emotion={emotionOpt.emotion}
                emoji={emotionOpt.emoji}
                label={emotionOpt.label}
                color={emotionOpt.color}
                onClick={() => handleEmotionSelect(emotionOpt.emotion)}
                isVisible={appState === 'checkin'}
                index={index}
              />
            ))}
          </div>

          {/* Instruction Subtext */}
          <p
            ref={subtextRef}
            className="mt-12 text-center font-inter"
            style={{
              fontSize: 'clamp(16px, 2vw, 18px)',
              color: '#29445A',
              opacity: 0,
            }}
          >
            Kies het gezichtje dat het beste past bij hoe je je voelt.
          </p>

          {/* Back button to return to name selection */}
          <button
            onClick={handleBackToNameSelection}
            className="mt-8 font-inter font-medium transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0B193D] focus-visible:ring-offset-2"
            style={{
              fontSize: 16,
              color: '#29445A',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 16px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0B193D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#29445A';
            }}
            type="button"
          >
            ← Terug
          </button>

          {/* Hidden triple-click hint for staff */}
          <p
            className="mt-4 text-center font-inter"
            style={{
              fontSize: 12,
              color: '#29445A',
              opacity: 0.15,
              userSelect: 'none',
            }}
          >
            Driemaal klikken op de titel toont instellingen
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════
          STEP 3: CONFIRMATION
          ════════════════════════════════════════════ */}
      {appState === 'confirmation' && selectedEmotion && (
        <ConfirmationCard
          emotion={selectedEmotion}
          onReset={handleReset}
          timeLeft={timeLeft}
        />
      )}
    </div>
  );
}
