import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast, Toaster } from 'sonner';
import {
  Mail,
  Users,
  Settings as SettingsIcon,
  Plus,
  X,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

/* ------------------------------------------------------------------ */
/*  Password Gate                                                      */
/* ------------------------------------------------------------------ */

const STAFF_PASSWORD = 'emotie2024';

function usePasswordGate() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('emotiecheck_auth');
    if (saved === 'true') setUnlocked(true);
  }, []);

  const checkPassword = (pw: string) => {
    if (pw === STAFF_PASSWORD) {
      localStorage.setItem('emotiecheck_auth', 'true');
      setUnlocked(true);
      setError('');
    } else {
      setError('Onjuist wachtwoord. Toegang geweigerd.');
    }
  };

  return { unlocked, password, setPassword, error, checkPassword };
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Participant {
  id: number;
  name: string;
  activeToday: boolean;
}

/* ------------------------------------------------------------------ */
/*  Validation helpers                                                 */
/* ------------------------------------------------------------------ */

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ------------------------------------------------------------------ */
/*  Card animation wrapper                                             */
/* ------------------------------------------------------------------ */

function AnimatedCard({
  delay,
  children,
  className,
}: {
  delay: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={className}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 600ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 600ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Settings Page                                                 */
/* ------------------------------------------------------------------ */

export default function Settings() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const pwGate = usePasswordGate();

  /* ---- tRPC hooks ---- */
  const configQuery = trpc.whatsapp.getConfig.useQuery();
  const emotionsQuery = trpc.emotion.listToday.useQuery();

  const updateConfig = trpc.whatsapp.updateConfig.useMutation({
    onSuccess: () => {
      utils.whatsapp.getConfig.invalidate();
      toast.success('Instellingen opgeslagen');
    },
    onError: () => {
      toast.error('Er is iets misgegaan. Probeer opnieuw.');
    },
  });

  const sendTest = trpc.whatsapp.sendTest.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Testbericht verstuurd!');
      } else {
        toast.error(data.message ?? 'Testbericht kon niet worden verstuurd.');
      }
    },
    onError: () => {
      toast.error('Er is iets misgegaan. Probeer opnieuw.');
    },
  });

  /* ---- Local state ---- */
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [template, setTemplate] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, name: 'Deelnemer 1', activeToday: true },
    { id: 2, name: 'Deelnemer 2', activeToday: false },
    { id: 3, name: 'Deelnemer 3', activeToday: true },
  ]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [participantError, setParticipantError] = useState('');
  const [autoResetSeconds, setAutoResetSeconds] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);

  /* ---- Sync from query ---- */
  useEffect(() => {
    if (configQuery.data?.phoneNumber) {
      setPhone(configQuery.data.phoneNumber);
    }
  }, [configQuery.data?.phoneNumber]);

  /* ---- Phone validation ---- */
  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (phoneError) setPhoneError('');
  };

  const handlePhoneBlur = () => {
    if (phone && !isValidEmail(phone)) {
      setPhoneError('Voer een geldig emailadres in.');
    } else {
      setPhoneError('');
    }
  };

  /* ---- Save handler ---- */
  const handleSave = useCallback(() => {
    if (phone && !isValidEmail(phone)) {
      setPhoneError('Voer een geldig emailadres in.');
      toast.error('Controleer het telefoonnummer.');
      return;
    }
    updateConfig.mutate({
      phoneNumber: phone || undefined,
    });
  }, [phone, updateConfig]);

  /* ---- Test message ---- */
  const handleTest = useCallback(() => {
    if (!phone) {
      toast.error('Voer eerst een telefoonnummer in.');
      return;
    }
    if (!isValidEmail(phone)) {
      setPhoneError('Voer een geldig emailadres in.');
      toast.error('Controleer het telefoonnummer.');
      return;
    }
    sendTest.mutate({ phoneNumber: phone });
  }, [phone, sendTest]);

  /* ---- Participant handlers ---- */
  const handleAddParticipant = () => {
    const name = newParticipantName.trim();
    if (!name) {
      setParticipantError('Voer een naam in.');
      return;
    }
    setParticipantError('');
    const newId =
      participants.length > 0
        ? Math.max(...participants.map((p) => p.id)) + 1
        : 1;
    setParticipants((prev) => [
      ...prev,
      { id: newId, name, activeToday: false },
    ]);
    setNewParticipantName('');
    toast.success('Deelnemer toegevoegd');
  };

  const handleDeleteParticipant = (id: number) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    toast.success('Deelnemer verwijderd');
  };

  const handleKeyDownAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddParticipant();
    }
  };

  /* ---- Auto-reset handler ---- */
  const handleAutoResetChange = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      setAutoResetSeconds(30);
      return;
    }
    const clamped = Math.min(300, Math.max(10, num));
    setAutoResetSeconds(clamped);
  };

  /* ---- Determine active participants from emotion data ---- */
  const activeParticipantIds = new Set<number>();
  if (emotionsQuery.data?.emotions) {
    emotionsQuery.data.emotions.forEach((e: { deviceId: string | null }) => {
      const match = e.deviceId?.match(/deelnemer-(\d+)/i);
      if (match) activeParticipantIds.add(parseInt(match[1], 10));
    });
  }

  /* ---- Derived state ---- */
  const isSaving = updateConfig.isPending;
  const isTesting = sendTest.isPending;

  /* ---- Input base styles ---- */
  const inputBaseStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: "'Inter', sans-serif",
  };

  const inputErrorStyle: React.CSSProperties = {
    ...inputBaseStyle,
    border: '1px solid #E74C3C',
  };

  /* ================================================================== */

  if (false && !pwGate.unlocked) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center px-4"
        style={{ background: '#0B193D', fontFamily: 'Inter, sans-serif' }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="mb-6 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'rgba(231,76,60,0.1)' }}
            >
              <Lock size={28} color="#E74C3C" />
            </div>
          </div>
          <h2
            className="mb-2 text-center font-poppins font-bold"
            style={{ fontSize: 24, color: '#FFFFFF' }}
          >
            Beveiligd
          </h2>
          <p
            className="mb-6 text-center font-inter"
            style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}
          >
            Voer het wachtwoord in om toegang te krijgen.
          </p>
          <Input
            type="password"
            placeholder="Wachtwoord"
            value={pwGate.password}
            onChange={(e) => {
              pwGate.setPassword(e.target.value);
              if (pwGate.error) pwGate.setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') pwGate.checkPassword(pwGate.password);
            }}
            className="mb-3 w-full"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              color: '#FFFFFF',
              padding: '14px 16px',
            }}
          />
          {pwGate.error && (
            <p className="mb-3 font-inter" style={{ fontSize: 13, color: '#E74C3C' }}>
              {pwGate.error}
            </p>
          )}
          <Button
            onClick={() => pwGate.checkPassword(pwGate.password)}
            className="w-full rounded-full font-inter font-medium"
            style={{
              background: '#27AE60',
              color: '#FFFFFF',
              padding: '14px',
            }}
          >
            Toegang aanvragen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="font-inter min-h-[100dvh] w-full overflow-y-auto"
      style={{ background: '#0B193D' }}
    >
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(11,25,61,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
          },
        }}
      />

      {/* ---- Navigation Bar ---- */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6"
        style={{
          height: 64,
          background: '#0B193D',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="font-poppins font-semibold"
            style={{ fontSize: 18, color: '#FFFFFF' }}
          >
            EmotieCheck
          </span>
          <span
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Dagbesteding
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="font-inter transition-colors duration-200 hover:text-white focus:outline-none"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.4)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Dashboard
          </button>
          <span
            className="font-inter"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#FFFFFF',
            }}
          >
            Instellingen
          </span>
        </div>
      </nav>

      {/* ---- Main Content ---- */}
      <div className="mx-auto px-6 pb-12" style={{ maxWidth: 800 }}>
        {/* Page header */}
        <div className="pt-10 pb-8">
          <h1
            className="font-poppins font-semibold"
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              color: '#FFFFFF',
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
            }}
          >
            Instellingen
          </h1>
          <p
            className="mt-2 font-inter"
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
            }}
          >
            Configureer het EmotieCheck-systeem
          </p>
        </div>

        {/* ---- Section 1: Email Notifications ---- */}
        <AnimatedCard delay={200}>
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 32,
            }}
          >
            {/* Card Header */}
            <div className="flex items-center gap-3">
              <Mail size={24} color="#27AE60" />
              <div>
                <h2
                  className="font-poppins font-semibold"
                  style={{ fontSize: 24, color: '#FFFFFF' }}
                >
                  Email-meldingen
                </h2>
                <p
                  className="mt-1 font-inter"
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.4,
                  }}
                >
                  Ontvang een email melding bij een rode registratie.
                  Gratis via Resend (3.000 emails/maand).
                </p>
              </div>
            </div>

            {/* Divider */}
            <div
              className="my-6 w-full"
              style={{
                height: 1,
                background: 'rgba(255,255,255,0.08)',
              }}
            />

            {/* Setup Instructions */}
            <div
              className="mb-6 rounded-lg p-4"
              style={{
                background: 'rgba(39,174,96,0.08)',
                border: '1px solid rgba(39,174,96,0.2)',
              }}
            >
              <p
                className="font-inter font-medium"
                style={{ fontSize: 13, color: '#27AE60', marginBottom: 8 }}
              >
                &#x1F4E7; Eenmalige setup (2 minuten):
              </p>
              <ol
                className="font-inter"
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.8,
                  paddingLeft: 16,
                }}
              >
                <li>Ga naar <strong>resend.com</strong> en maak een gratis account</li>
                <li>Klik op <strong>"API Keys"</strong> en maak een nieuwe key aan</li>
                <li>Kopieer de API key en plak hieronder</li>
                <li>Vul het emailadres in waar meldingen naar toe moeten</li>
              </ol>
            </div>

            {/* Email Address Field */}
            <div className="mb-6">
              <label
                className="mb-2 block font-inter font-medium"
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Emailadres zorgmedewerker
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.3)',
                  }}
                />
                <Input
                  type="email"
                  placeholder="naam@deterugwinning.nl"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={handlePhoneBlur}
                  className="w-full"
                  style={{
                    ...(phoneError ? inputErrorStyle : inputBaseStyle),
                    padding: '16px 16px 16px 44px',
                  }}
                />
              </div>
              {phoneError && (
                <p
                  className="mt-2 font-inter"
                  style={{ fontSize: 13, color: '#E74C3C' }}
                >
                  {phoneError}
                </p>
              )}
            </div>

            {/* API Key Field */}
            <div className="mb-6">
              <label
                className="mb-2 block font-inter font-medium"
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Resend API Key
              </label>
              <Input
                type="password"
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full"
                style={{
                  ...inputBaseStyle,
                  padding: '16px',
                }}
              />
              <p
                className="mt-2 font-inter"
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.3)',
                  lineHeight: 1.4,
                }}
              >
                Gebruuk {'{tijd}'} om de tijd van de melding in te voegen.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleTest}
                disabled={isTesting}
                className="font-inter font-medium transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.7)',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 9999,
                  padding: '12px 24px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#27AE60';
                  e.currentTarget.style.color = '#27AE60';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
              >
                {isTesting ? 'Versturen...' : 'Testbericht versturen'}
              </button>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="font-inter font-semibold"
                style={{
                  fontSize: 14,
                  background: '#E6EDE8',
                  color: '#0B193D',
                  borderRadius: 9999,
                  padding: '12px 32px',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    '#E6EDE8';
                }}
              >
                {isSaving ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </div>
          </div>
        </AnimatedCard>

        {/* ---- Section 2: Participant Management ---- */}
        <div className="mt-6">
          <AnimatedCard delay={350}>
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 32,
              }}
            >
              {/* Card Header */}
              <div className="flex items-center gap-3">
                <Users size={24} color="#F39C12" />
                <div>
                  <h2
                    className="font-poppins font-semibold"
                    style={{ fontSize: 24, color: '#FFFFFF' }}
                  >
                    Deelnemers
                  </h2>
                  <p
                    className="mt-1 font-inter"
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: 1.4,
                    }}
                  >
                    Beheer de deelnemers van de dagbesteding.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div
                className="my-6 w-full"
                style={{
                  height: 1,
                  background: 'rgba(255,255,255,0.08)',
                }}
              />

              {/* Participant List */}
              <div>
                {participants.map((participant) => {
                  const isActive =
                    participant.activeToday ||
                    activeParticipantIds.has(participant.id);
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between"
                      style={{
                        padding: '14px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: isActive
                              ? '#27AE60'
                              : 'rgba(255,255,255,0.2)',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          className="font-inter"
                          style={{
                            fontSize: 16,
                            color: '#FFFFFF',
                          }}
                        >
                          {participant.name}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleDeleteParticipant(participant.id)
                        }
                        className="transition-colors duration-200 focus:outline-none"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'rgba(255,255,255,0.3)',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#E74C3C';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color =
                            'rgba(255,255,255,0.3)';
                        }}
                        aria-label={`Verwijder ${participant.name}`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Participant */}
              <div
                className="flex items-center gap-3"
                style={{ marginTop: 16 }}
              >
                <Input
                  type="text"
                  placeholder="Naam deelnemer"
                  value={newParticipantName}
                  onChange={(e) => {
                    setNewParticipantName(e.target.value);
                    if (participantError) setParticipantError('');
                  }}
                  onKeyDown={handleKeyDownAdd}
                  className="flex-1"
                  style={
                    participantError
                      ? {
                          ...inputErrorStyle,
                          padding: '14px 16px',
                        }
                      : {
                          ...inputBaseStyle,
                          padding: '14px 16px',
                        }
                  }
                />
                <button
                  onClick={handleAddParticipant}
                  className="flex shrink-0 items-center justify-center transition-colors duration-200 focus:outline-none"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 9999,
                    background: '#27AE60',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#219a52';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#27AE60';
                  }}
                  aria-label="Deelnemer toevoegen"
                >
                  <Plus size={20} />
                </button>
              </div>
              {participantError && (
                <p
                  className="mt-2 font-inter"
                  style={{ fontSize: 13, color: '#E74C3C' }}
                >
                  {participantError}
                </p>
              )}
            </div>
          </AnimatedCard>
        </div>

        {/* ---- Section 3: System Settings ---- */}
        <div className="mt-6">
          <AnimatedCard delay={500}>
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 32,
              }}
            >
              {/* Card Header */}
              <div className="flex items-center gap-3">
                <SettingsIcon size={24} color="#29445A" />
                <div>
                  <h2
                    className="font-poppins font-semibold"
                    style={{ fontSize: 24, color: '#FFFFFF' }}
                  >
                    Systeem
                  </h2>
                </div>
              </div>

              {/* Divider */}
              <div
                className="my-6 w-full"
                style={{
                  height: 1,
                  background: 'rgba(255,255,255,0.08)',
                }}
              />

              {/* Auto-Reset Timer */}
              <div className="mb-6">
                <label
                  className="mb-1 block font-inter font-medium"
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  Auto-reset timer
                </label>
                <p
                  className="mb-3 font-inter"
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.4)',
                    lineHeight: 1.4,
                  }}
                >
                  Tijd voordat het scherm terugkeert naar de check-in.
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={10}
                    max={300}
                    value={autoResetSeconds}
                    onChange={(e) => handleAutoResetChange(e.target.value)}
                    className="w-[120px]"
                    style={{
                      ...inputBaseStyle,
                      padding: '14px 16px',
                    }}
                  />
                  <span
                    className="font-inter"
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    seconden
                  </span>
                </div>
              </div>

              {/* Sound Toggle */}
              <div
                className="flex items-center justify-between"
                style={{ padding: '16px 0' }}
              >
                <div>
                  <label
                    className="block font-inter font-medium"
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    Geluid bij melding
                  </label>
                  <p
                    className="mt-1 font-inter"
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.4)',
                      lineHeight: 1.4,
                    }}
                  >
                    Speel een geluid af bij een nieuwe registratie.
                  </p>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  className="shrink-0"
                  style={{
                    // Custom track styling via CSS
                    // The shadcn Switch uses data-state for checked
                  }}
                />
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* ---- Footer spacer ---- */}
        <div className="mt-10 pb-8 text-center font-inter" style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Beveiligde toegang
        </div>

        {/* Footer text */}
        <div
          className="pb-8 text-center font-inter"
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          Dagbesteding EmotieCheck v1.0
        </div>
      </div>
    </div>
  );
}
