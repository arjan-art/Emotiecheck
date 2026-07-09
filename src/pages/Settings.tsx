import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast, Toaster } from 'sonner';
import { Mail, Lock } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const STAFF_PASSWORD = 'emotie2024';

export default function Settings() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  
  // Password gate
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');
  
  useEffect(() => {
    if (localStorage.getItem('emotiecheck_auth') === 'true') setUnlocked(true);
  }, []);
  
  const checkPw = (pw: string) => {
    if (pw === STAFF_PASSWORD) {
      localStorage.setItem('emotiecheck_auth', 'true');
      setUnlocked(true);
      setPwError('');
    } else {
      setPwError('Onjuist wachtwoord.');
    }
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ background: '#0B193D' }}>
        <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(231,76,60,0.1)' }}>
              <Lock size={28} color="#E74C3C" />
            </div>
          </div>
          <h2 className="mb-2 text-center font-poppins font-bold text-2xl text-white">Beveiligd</h2>
          <p className="mb-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Voer het wachtwoord in.</p>
          <Input type="password" placeholder="Wachtwoord" value={password}
            onChange={(e) => { setPassword(e.target.value); setPwError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && checkPw(password)}
            className="mb-3 w-full text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 16px' }}
          />
          {pwError && <p className="mb-3 text-sm text-red-400">{pwError}</p>}
          <Button onClick={() => checkPw(password)} className="w-full rounded-full bg-green-600 text-white hover:bg-green-700" style={{ padding: '14px' }}>
            Toegang aanvragen
          </Button>
        </div>
      </div>
    );
  }

  // --- Main settings content ---
  const configQuery = trpc.whatsapp.getConfig.useQuery();
  const updateConfig = trpc.whatsapp.updateConfig.useMutation({
    onSuccess: () => { utils.whatsapp.getConfig.invalidate(); toast.success('Opgeslagen'); },
  });
  const sendTest = trpc.whatsapp.sendTest.useMutation({
    onSuccess: (d) => { d.success ? toast.success('Test verstuurd!') : toast.error(d.message); },
  });

  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (configQuery.data) {
      setEmail(configQuery.data.phoneNumber || '');
      setApiKey(configQuery.data.apiKey || '');
      setEnabled(configQuery.data.enabled || false);
    }
  }, [configQuery.data]);

  const handleSave = () => updateConfig.mutate({ phoneNumber: email, apiKey, enabled });
  const handleTest = () => { if (!email) return toast.error('Vul email in'); sendTest.mutate({ phoneNumber: email }); };

  return (
    <div className="min-h-[100dvh] overflow-y-auto" style={{ background: '#0B193D', fontFamily: 'Inter, sans-serif' }}>
      <Toaster position="top-center" />
      
      {/* Nav */}
      <nav className="flex items-center justify-between px-8" style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-baseline gap-2">
          <span className="font-poppins font-semibold text-white text-xl">EmotieCheck</span>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Dagbesteding</span>
        </div>
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Beveiligd</span>
      </nav>

      <main className="mx-auto px-6 py-10" style={{ maxWidth: 800 }}>
        <h1 className="mb-10 font-poppins font-bold text-3xl text-white">Instellingen</h1>

        {/* Email */}
        <div className="rounded-2xl p-8 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 mb-6">
            <Mail size={24} color="#27AE60" />
            <h2 className="font-poppins font-semibold text-2xl text-white">Email-meldingen</h2>
          </div>
          
          <div className="mb-6 rounded-lg p-4" style={{ background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: '#27AE60' }}>Setup (2 minuten):</p>
            <ol className="text-xs space-y-1" style={{ color: 'rgba(255,255,255,0.6)', paddingLeft: 16 }}>
              <li>1. Ga naar resend.com en maak gratis account</li>
              <li>2. Klik "API Keys" → "Create API Key"</li>
              <li>3. Kopieer de key en plak hieronder</li>
            </ol>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Emailadres zorgmedewerker</label>
            <Input type="email" placeholder="naam@deterugwinning.nl" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 16px' }} />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Resend API Key</label>
            <Input type="password" placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 16px' }} />
          </div>

          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Meldingen inschakelen</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleTest} className="rounded-full border-green-600 text-green-400 hover:bg-green-900/20">Testemail versturen</Button>
            <Button onClick={handleSave} className="rounded-full bg-green-600 text-white hover:bg-green-700">Opslaan</Button>
          </div>
        </div>

        {/* Footer */}
        <div className="pb-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Dagbesteding EmotieCheck v1.0
        </div>
      </main>
    </div>
  );
}
