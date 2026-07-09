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
} from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Participant {
  id: number;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
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
}: {
  delay: number;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 600ms cubic-bezier(0.4,0,0.2,1), transform 600ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Input styles                                                       */
/* ------------------------------------------------------------------ */

const inputBaseStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#FFFFFF',
  fontSize: 14,
};

const inputErrorStyle = {
  ...inputBaseStyle,
  border: '1px solid #E74C3C',
};

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function SettingsPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  /* ---- API ---- */
  const configQuery = trpc.whatsapp.getConfig.useQuery();
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
      if (data.success) toast.success('Test email verstuurd!');
      else toast.error(data.message);
    },
  });

  /* ---- Local state ---- */
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [template, setTemplate] = useState('');
  const [enabled, setEnabled] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, name: 'Deelnemer 1' },
    { id: 2, name: 'Deelnemer 2' },
    { id: 3, name: 'Deelnemer 3' },
  ]);
  const [newName, setNewName] = useState('');

  const emotionsQuery = trpc.emotion.listToday.useQuery();

  /* ---- Load from API ---- */
  useEffect(() => {
    if (configQuery.data) {
      setPhone(configQuery.data.phoneNumber);
      setApiKey(configQuery.data.apiKey);
      setEnabled(configQuery.data.enabled);
    }
  }, [configQuery.data]);

  /* ---- Validation ---- */
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

  /* ---- Actions ---- */
  const handleSave = () => {
    if (phone && !isValidEmail(phone)) {
      setPhoneError('Voer een geldig emailadres in.');
      return;
    }
    updateConfig.mutate({
      phoneNumber: phone,
      apiKey: apiKey,
      enabled: enabled,
    });
  };

  const handleTest = () => {
    if (!phone) {
      toast.error('Vul eerst een emailadres in.');
      return;
    }
    if (!isValidEmail(phone)) {
      setPhoneError('Voer een geldig emailadres in.');
      return;
    }
    sendTest.mutate({ phoneNumber: phone });
  };

  const handleAddParticipant = () => {
    if (!newName.trim()) return;
    setParticipants((prev) => [
      ...prev,
      { id: Date.now(), name: newName.trim() },
    ]);
    setNewName('');
    toast.success('Deelnemer toegevoegd');
  };

  const handleRemoveParticipant = (id: number) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    toast.success('Deelnemer verwijderd');
  };

  /* ---- Render ---- */
  return (
    <div
      className="min-h-screen"
      style={{ background: '#0B193D', fontFamily: 'Inter, sans-serif' }}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />

      {/* ---- Navigation Bar ---- */}
      <nav
        className="flex items-center justify-between px-6"
        style={{
          height: 64,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex flex-col">
          <span
            className="font-poppins font-semibold"
            style={{ fontSize: 20, color: '#FFFFFF' }}
          >
            EmotieCheck
          </span>
          <span
            className="font-inter"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}
          >
            Dagbesteding
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="font-inter transition-colors duration-200 hover:text-white"
            style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}
          >
            Dashboard
          </button>
          <span
            className="font-inter"
            style={{ fontSize: 14, color: '#FFFFFF' }}
          >
            Instellingen
          </span>
        </div>
      </nav>

      {/* ---- Content ---- */}
      <main className="mx-auto px-6 py-10" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <SettingsIcon size={28} color="#27AE60" />
          <h1
            className="font-poppins font-bold"
            style={{ fontSize: 32, color: '#FFFFFF' }}
          >
            Instellingen
          </h1>
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
                <li>Vul het emailadres in waar melding
