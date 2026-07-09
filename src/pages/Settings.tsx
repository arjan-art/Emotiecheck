import { useState, useEffect, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { Mail, Lock } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const STAFF_PASSWORD = 'emotie2024';

/* ------------------------------------------------------------------ */
/*  Password Gate                                                      */
/* ------------------------------------------------------------------ */

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
/*  Settings Page                                                      */
/* ------------------------------------------------------------------ */

export default function Settings() {
  const pwGate = usePasswordGate();

  /* ---- tRPC hooks (called unconditionally before any early return) ---- */
  const utils = trpc.useUtils();
  const configQuery = trpc.whatsapp.getConfig.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const updateConfig = trpc.whatsapp.updateConfig.useMutation({
    onSuccess: () => {
      utils.whatsapp.getConfig.invalidate();
      toast.success('Instellingen opgeslagen');
    },
    onError: (err) => {
      toast.error(err.message || 'Opslaan mislukt');
    },
  });

  const sendTest = trpc.whatsapp.sendTest.useMutation({
    onSuccess: (data) => {
      if (data.success) toast.success('Testemail verstuurd!');
      else toast.error(data.message || 'Test mislukt');
    },
    onError: (err) => {
      toast.error(err.message || 'Test mislukt');
    },
  });

  /* ---- Local state ---- */
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(false);

  /* ---- Sync from query ---- */
  useEffect(() => {
    if (configQuery.data) {
      setEmail(configQuery.data.phoneNumber || '');
      setApiKey(configQuery.data.apiKey || '');
      setEnabled(configQuery.data.enabled || false);
    }
  }, [configQuery.data]);

  /* ---- Handlers ---- */
  const handleSave = useCallback(() => {
    updateConfig.mutate({
      phoneNumber: email || undefined,
      apiKey: apiKey || undefined,
      enabled,
    });
  }, [email, apiKey, enabled, updateConfig]);

  const handleTest = useCallback(() => {
    if (!email) {
      toast.error('Vul eerst een emailadres in.');
      return;
    }
    sendTest.mutate({ phoneNumber: email });
  }, [email, sendTest]);

  /* ================================================================== */
  /*  PASSWORD SCREEN                                                  */
  /* ================================================================== */

  if (!pwGate.unlocked) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: '#0B193D',
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 20,
            padding: 40,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(231,76,60,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={28} color="#E74C3C" />
            </div>
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Beveiligd
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Voer het wachtwoord in om toegang te krijgen.
          </p>
          <Input
            type="password"
            placeholder="Wachtwoord"
            value={pwGate.password}
            onChange={(e) => {
              pwGate.setPassword(e.target.value);
              if (pwGate.error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') pwGate.checkPassword(pwGate.password);
            }}
            style={{
              width: '100%',
              marginBottom: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              color: '#FFFFFF',
              padding: '14px 16px',
            }}
          />
          {pwGate.error && (
            <p style={{ fontSize: 13, color: '#E74C3C', marginBottom: 12 }}>
              {pwGate.error}
            </p>
          )}
          <Button
            onClick={() => pwGate.checkPassword(pwGate.password)}
            style={{
              width: '100%',
              borderRadius: 9999,
              background: '#27AE60',
              color: '#FFFFFF',
              padding: '14px',
              fontWeight: 500,
            }}
          >
            Toegang aanvragen
          </Button>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /*  MAIN SETTINGS CONTENT                                            */
  /* ================================================================== */

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0B193D',
        fontFamily: 'Inter, sans-serif',
        overflowY: 'auto',
      }}
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

      {/* Nav */}
      <nav
        style={{
          height: 64,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <div>
          <span style={{ fontSize: 20, fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>
            EmotieCheck
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
            Dagbesteding
          </span>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Beveiligd</span>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            fontFamily: 'Poppins, sans-serif',
            color: '#FFFFFF',
            marginBottom: 32,
          }}
        >
          Instellingen
        </h1>

        {/* Email Card */}
        <div
          style={{
            borderRadius: 16,
            padding: 32,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <Mail size={24} color="#27AE60" />
            <h2 style={{ fontSize: 22, fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>
              Email-meldingen
            </h2>
          </div>

          <div
            style={{
              borderRadius: 8,
              padding: 16,
              background: 'rgba(39,174,96,0.08)',
              border: '1px solid rgba(39,174,96,0.2)',
              marginBottom: 24,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 500, color: '#27AE60', marginBottom: 8 }}>
              Setup (2 minuten):
            </p>
            <ol style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, paddingLeft: 16 }}>
              <li>Ga naar resend.com en maak gratis account</li>
              <li>Klik &quot;API Keys&quot; en maak een nieuwe key aan</li>
              <li>Kopieer de key en plak hieronder</li>
            </ol>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
              Emailadres zorgmedewerker
            </label>
            <Input
              type="email"
              placeholder="naam@deterugwinning.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                color: '#FFFFFF',
                padding: '14px 16px',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
              Resend API Key
            </label>
            <Input
              type="password"
              placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                color: '#FFFFFF',
                padding: '14px 16px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
              Meldingen inschakelen
            </span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              variant="outline"
              onClick={handleTest}
              style={{
                borderRadius: 9999,
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                background: 'transparent',
                padding: '12px 24px',
              }}
            >
              Testemail versturen
            </Button>
            <Button
              onClick={handleSave}
              style={{
                borderRadius: 9999,
                background: '#27AE60',
                color: '#FFFFFF',
                padding: '12px 24px',
              }}
            >
              Opslaan
            </Button>
          </div>

          {configQuery.isError && (
            <p style={{ marginTop: 16, fontSize: 13, color: '#E74C3C' }}>
              Waarschuwing: Kon geen verbinding maken met de server. Sommige functies werken mogelijk niet.
            </p>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 40, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Dagbesteding EmotieCheck v1.0
        </p>
      </div>
    </div>
  );
}
