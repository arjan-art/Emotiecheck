import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { trpc } from '@/providers/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STAFF_PASSWORD = 'emotie2024';

const easeGentle = [0.4, 0, 0.2, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 + 0.2, duration: 0.6, ease: easeGentle },
  }),
};

function formatTime(date: Date | string): string {
  return format(new Date(date), 'HH:mm', { locale: nl });
}

function formatDateNL(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: nl });
}

function DashboardNav() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeGentle }}
      className="flex items-center justify-between border-b border-white/[0.08] bg-[#0B193D] px-8"
      style={{ height: 64 }}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-poppins font-semibold text-white" style={{ fontSize: 20 }}>
          EmotieCheck
        </span>
        <span className="font-inter font-normal" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          Dagbesteding
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span className="font-inter font-normal" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          Beveiligd
        </span>
      </div>
    </motion.nav>
  );
}

export default function Dashboard() {
  const utils = trpc.useUtils();
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('emotiecheck_auth');
    if (saved === 'true') setUnlocked(true);
  }, []);

  const checkPassword = (pw: string) => {
    if (pw === STAFF_PASSWORD) {
      localStorage.setItem('emotiecheck_auth', 'true');
      setUnlocked(true);
      setPwError('');
    } else {
      setPwError('Onjuist wachtwoord. Toegang geweigerd.');
    }
  };

  const statsQuery = trpc.emotion.getStats.useQuery(undefined, { refetchInterval: 30000 });
  const emotionsQuery = trpc.emotion.listToday.useQuery(undefined, { refetchInterval: 30000 });
  const alertsQuery = trpc.emotion.getActiveAlerts.useQuery(undefined, { refetchInterval: 30000 });

  const markHandled = trpc.emotion.markHandled.useMutation({
    onSuccess: () => {
      utils.emotion.getActiveAlerts.invalidate();
      utils.emotion.listToday.invalidate();
      utils.emotion.getStats.invalidate();
    },
  });

  const handleMarkHandled = (id: number) => markHandled.mutate({ id });
  const todayLabel = useMemo(() => formatDateNL(new Date()), []);

  if (!unlocked) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ background: '#0B193D', fontFamily: 'Inter, sans-serif' }}>
        <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(231,76,60,0.1)' }}>
              <Lock size={28} color="#E74C3C" />
            </div>
          </div>
          <h2 className="mb-2 text-center font-poppins font-bold" style={{ fontSize: 24, color: '#FFFFFF' }}>Beveiligd</h2>
          <p className="mb-6 text-center font-inter" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            Voer het wachtwoord in om toegang te krijgen tot het dashboard.
          </p>
          <Input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (pwError) setPwError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') checkPassword(password); }}
            className="mb-3 w-full"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#FFFFFF', padding: '14px 16px' }}
          />
          {pwError && <p className="mb-3 font-inter" style={{ fontSize: 13, color: '#E74C3C' }}>{pwError}</p>}
          <Button onClick={() => checkPassword(password)} className="w-full rounded-full font-inter font-medium" style={{ background: '#27AE60', color: '#FFFFFF', padding: '14px' }}>
            Toegang aanvragen
          </Button>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const emotions = emotionsQuery.data?.emotions ?? [];
  const alerts = alertsQuery.data ?? [];

  return (
    <div className="min-h-[100dvh] bg-[#0B193D]">
      <DashboardNav />
      <div className="mx-auto w-full px-8" style={{ maxWidth: 1200 }}>
        <section style={{ padding: '48px 0 32px' }}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: easeGentle }} className="mb-6 font-inter" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>
            Vandaag — {todayLabel}
          </motion.p>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Registraties', value: stats?.total ?? 0, pct: null, color: '#FFFFFF' },
              { label: 'Groen', value: stats?.groen ?? 0, pct: stats?.percentages?.groen ?? 0, color: '#27AE60' },
              { label: 'Oranje', value: stats?.oranje ?? 0, pct: stats?.percentages?.oranje ?? 0, color: '#F39C12' },
              { label: 'Rood', value: stats?.rood ?? 0, pct: stats?.percentages?.rood ?? 0, color: '#E74C3C' },
            ].map((s, i) => (
              <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="visible" className="relative rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Activity size={18} className="absolute top-4 right-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="font-inter font-medium" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
                <p className="mt-2 font-poppins font-bold" style={{ fontSize: 32, color: s.color }}>{s.value}</p>
                {s.pct !== null && <p className="mt-1 font-inter" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{s.pct}%</p>}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-8" style={{ padding: '32px 0 64px' }}>
          <div>
            <h2 className="mb-6 font-poppins font-semibold text-white" style={{ fontSize: 20 }}>Tijdlijn vandaag</h2>
            {emotions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl py-16" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Activity size={32} style={{ color: 'rgba(255,255,255,0.15)' }} />
                <p className="mt-4 font-inter" style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Nog geen registraties vandaag.</p>
              </div>
            ) : (
              <div className="relative space-y-0">
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
                {emotions.map((item, i) => (
                  <motion.div key={item.id} custom={i} variants={{ hidden: { opacity: 0, x: -20 }, visible: (idx: number) => ({ opacity: 1, x: 0, transition: { delay: idx * 0.08, duration: 0.5, ease: easeGentle } }) }} initial="hidden" animate="visible" className="relative flex items-center py-3">
                    <div className="relative z-10 mr-4 h-4 w-4 rounded-full" style={{ background: item.emotion === 'groen' ? '#27AE60' : item.emotion === 'oranje' ? '#F39C12' : '#E74C3C', boxShadow: `0 0 0 4px #0B193D` }} />
                    <span className="w-12 font-inter tabular-nums" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{formatTime(item.createdAt)}</span>
                    <span className="ml-4 font-inter" style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>{item.participantName ?? 'Onbekend'}</span>
                    <span className="ml-auto rounded-full px-3 py-1 font-inter font-medium" style={{ fontSize: 12, background: item.emotion === 'groen' ? 'rgba(39,174,96,0.15)' : item.emotion === 'oranje' ? 'rgba(243,156,18,0.15)' : 'rgba(231,76,60,0.15)', color: item.emotion === 'groen' ? '#27AE60' : item.emotion === 'oranje' ? '#F39C12' : '#E74C3C' }}>
                      {item.emotion === 'groen' ? 'Goed' : item.emotion === 'oranje' ? 'Matig' : 'Niet goed'}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-6 font-poppins font-semibold text-white" style={{ fontSize: 20 }}>Actieve meldingen</h2>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl py-16" style={{ background: 'rgba(39,174,96,0.04)', border: '1px solid rgba(39,174,96,0.1)' }}>
                <CheckCircle size={32} color="#27AE60" />
                <p className="mt-4 text-center font-inter" style={{ fontSize: 14, color: '#27AE60' }}>Geen actieve meldingen.<br />Alles is in orde.</p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <motion.div key={alert.id} custom={i} variants={fadeUp} initial="hidden" animate="visible" className="relative mb-4 rounded-2xl p-6" style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderLeft: '4px solid #E74C3C' }}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={24} color="#E74C3C" />
                    <span className="font-inter font-semibold" style={{ fontSize: 16, color: '#E74C3C' }}>
                      {alert.participantName ?? 'Onbekend'} — {formatTime(alert.createdAt)} — Nog niet afgehandeld
                    </span>
                  </div>
                  <button onClick={() => handleMarkHandled(alert.id)} className="mt-4 rounded-full bg-[#E74C3C] px-6 py-2.5 font-inter font-medium text-white transition-colors duration-200 hover:bg-[#c0392b]" style={{ fontSize: 14 }}>
                    Markeren als afgehandeld
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
