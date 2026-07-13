import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { trpc } from '@/providers/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STAFF_PASSWORD = 'emotie2024';

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const easeGentle = [0.4, 0, 0.2, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 + 0.2, duration: 0.6, ease: easeGentle },
  }),
};

const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08 + 0.4, duration: 0.5, ease: easeGentle },
  }),
};

const alertFadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: easeGentle },
  }),
};

/* ------------------------------------------------------------------ */
/*  Emotion helpers                                                    */
/* ------------------------------------------------------------------ */

type EmotionType = 'groen' | 'oranje' | 'rood';

const EMOTION_EMOJI: Record<EmotionType, string> = {
  groen: '\uD83D\uDE0A',
  oranje: '\uD83D\uDE10',
  rood: '\uD83D\uDE22',
};

const EMOTION_COLOR: Record<EmotionType, string> = {
  groen: '#27AE60',
  oranje: '#F39C12',
  rood: '#E74C3C',
};

const EMOTION_LABEL: Record<EmotionType, string> = {
  groen: 'Goed',
  oranje: 'Matig',
  rood: 'Niet goed',
};

const isEmotion = (e: string): e is EmotionType =>
  e === 'groen' || e === 'oranje' || e === 'rood';

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm');
}

function formatDateNL(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: nl });
}

function participantNameDisplay(name: string | null | undefined): string {
  return name?.trim() || 'Onbekende deelnemer';
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function DashboardNav() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeGentle }}
      className="flex items-center justify-between border-b border-white/[0.08] bg-[#0B193D] px-8"
      style={{ height: 64 }}
    >
      {/* Left: branding */}
      <div className="flex items-baseline gap-2">
        <span
          className="font-poppins font-semibold text-white"
          style={{ fontSize: 20 }}
        >
          EmotieCheck
        </span>
        <span
          className="font-inter font-normal"
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.04em',
          }}
        >
          Dagbesteding
        </span>
      </div>

      {/* Right: no public links */}
      <div className="flex items-center gap-6">
        <span
          className="font-inter font-normal"
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}
        >
          Beveiligd
        </span>
      </div>
    </motion.nav>
  );
}

/* ---------- Stat Card ---------- */

interface StatCardProps {
  label: string;
  labelColor?: string;
  value: string | number;
  valueColor?: string;
  subtext?: string;
  index: number;
}

function StatCard({
  label,
  labelColor = 'rgba(255,255,255,0.4)',
  value,
  valueColor = '#FFFFFF',
  subtext,
  index,
}: StatCardProps) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="relative flex-1 rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 200,
      }}
    >
      <Activity
        size={20}
        className="absolute right-4 top-4"
        style={{ color: 'rgba(255,255,255,0.2)' }}
      />
      <p
        className="mb-2 font-inter font-medium uppercase"
        style={{
          fontSize: 13,
          color: labelColor,
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </p>
      <p
        className="font-poppins font-bold"
        style={{ fontSize: 48, color: valueColor, lineHeight: 1 }}
      >
        {value}
      </p>
      {subtext && (
        <p
          className="mt-1 font-inter font-normal"
          style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}
        >
          {subtext}
        </p>
      )}
    </motion.div>
  );
}

/* ---------- Timeline Item ---------- */

interface TimelineItemProps {
  emotion: string;
  createdAt: Date | string;
  participantName: string | null;
  index: number;
}

function TimelineItem({ emotion, createdAt, participantName, index }: TimelineItemProps) {
  const color = isEmotion(emotion) ? EMOTION_COLOR[emotion] : '#FFFFFF';
  const emoji = isEmotion(emotion) ? EMOTION_EMOJI[emotion] : '?';
  const label = isEmotion(emotion) ? EMOTION_LABEL[emotion] : emotion;
  const badgeBg = isEmotion(emotion)
    ? `${EMOTION_COLOR[emotion]}26`
    : 'rgba(255,255,255,0.1)';
  const badgeColor = color;

  return (
    <motion.div
      custom={index}
      variants={slideInLeft}
      initial="hidden"
      animate="visible"
      className="relative flex items-center py-4"
    >
      {/* Time stamp */}
      <span
        className="w-[60px] shrink-0 font-inter font-medium"
        style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}
      >
        {formatTime(createdAt)}
      </span>

      {/* Connector dot */}
      <div className="relative z-10 ml-4 flex items-center justify-center">
        <div
          className="rounded-full"
          style={{
            width: 12,
            height: 12,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Emoji */}
      <span className="ml-4" style={{ fontSize: 24 }}>
        {emoji}
      </span>

      {/* Participant name */}
      <span
        className="ml-4 font-inter font-normal text-white"
        style={{ fontSize: 16 }}
      >
        {participantNameDisplay(participantName)}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Emotion badge */}
      <span
        className="rounded-full font-inter font-semibold"
        style={{
          fontSize: 12,
          backgroundColor: badgeBg,
          color: badgeColor,
          padding: '6px 14px',
          borderRadius: 9999,
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}

/* ---------- Alert Card ---------- */

interface AlertCardProps {
  id: number;
  createdAt: Date | string;
  participantName: string | null;
  index: number;
  onMarkHandled: (id: number) => void;
}

function AlertCard({ id, createdAt, participantName, index, onMarkHandled }: AlertCardProps) {
  const name = participantNameDisplay(participantName);
  return (
    <motion.div
      custom={index}
      variants={alertFadeUp}
      initial="hidden"
      animate="visible"
      className="relative mb-4 rounded-2xl p-6"
      style={{
        background: 'rgba(231,76,60,0.08)',
        border: '1px solid rgba(231,76,60,0.2)',
        borderLeft: '4px solid #E74C3C',
      }}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle size={24} color="#E74C3C" />
        <span
          className="font-inter font-semibold"
          style={{ fontSize: 16, color: '#E74C3C' }}
        >
          &#x1F6A8; {name} &mdash; {formatTime(createdAt)} &mdash; Nog niet afgehandeld
        </span>
      </div>
      <p
        className="mt-3 font-inter italic"
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}
      >
        Bericht: &#x1F6A8; EmotieCheck &mdash; {name} heeft aangegeven zich niet goed te voelen...
      </p>
      <button
        onClick={() => onMarkHandled(id)}
        className="mt-4 rounded-full bg-[#E74C3C] px-6 py-2.5 font-inter font-medium text-white transition-colors duration-200 hover:bg-[#c0392b]"
        style={{ fontSize: 14 }}
        type="button"
      >
        Markeren als afgehandeld
      </button>
    </motion.div>
  );
}

/* ---------- Empty Timeline State ---------- */

function EmptyTimeline() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Activity size={32} style={{ color: 'rgba(255,255,255,0.1)' }} />
      <p
        className="mt-4 max-w-md text-center font-inter italic"
        style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}
      >
        Nog geen registraties vandaag. De deelnemers verschijnen hier zodra ze hun emotie doorgeven.
      </p>
    </div>
  );
}

/* ---------- Empty Alerts State ---------- */

function EmptyAlerts() {
  return (
    <div
      className="relative flex items-center gap-3 rounded-2xl p-6"
      style={{
        background: 'rgba(39,174,96,0.05)',
        border: '1px solid rgba(39,174,96,0.15)',
        borderLeft: '4px solid #27AE60',
      }}
    >
      <CheckCircle size={24} color="#27AE60" />
      <span
        className="font-inter italic"
        style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}
      >
        Geen actieve meldingen. Alles is in orde.
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Page                                                */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const utils = trpc.useUtils();

  /* ---- Password gate ---- */
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

  /* ---- tRPC queries ---- */
  const statsQuery = trpc.emotion.getStats.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const emotionsQuery = trpc.emotion.listToday.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const alertsQuery = trpc.emotion.getActiveAlerts.useQuery(undefined, {
    refetchInterval: 30000,
  });

  /* ---- Mark handled mutation ---- */
  const markHandled = trpc.emotion.markHandled.useMutation({
    onSuccess: () => {
      utils.emotion.getActiveAlerts.invalidate();
      utils.emotion.listToday.invalidate();
      utils.emotion.getStats.invalidate();
    },
  });

  const handleMarkHandled = (id: number) => {
    markHandled.mutate({ id });
  };

  /* ---- Derived data ---- */
  const todayLabel = useMemo(() => formatDateNL(new Date()), []);

  const emotions = emotionsQuery.data?.emotions ?? [];
  const alerts = alertsQuery.data ?? [];

  const stats = statsQuery.data ?? {
    total: 0,
    groen: 0,
    oranje: 0,
    rood: 0,
    percentages: { groen: 0, oranje: 0, rood: 0 },
  };

  /* ---- Loading states ---- */
  const isLoading = statsQuery.isLoading || emotionsQuery.isLoading;

  if (!unlocked) {
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
            Voer het wachtwoord in om toegang te krijgen tot het dashboard.
          </p>
          <Input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (pwError) setPwError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') checkPassword(password);
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
          {pwError && (
            <p className="mb-3 font-inter" style={{ fontSize: 13, color: '#E74C3C' }}>
              {pwError}
            </p>
          )}
          <Button
            onClick={() => checkPassword(password)}
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
    <div className="min-h-[100dvh] bg-[#0B193D]">
      {/* Navigation */}
      <DashboardNav noLinks />

      {/* Main content */}
      <div
        className="mx-auto w-full px-8"
        style={{ maxWidth: 1200 }}
      >
        {/* ====== Section 1: Stats Bar ====== */}
        <section style={{ padding: '48px 0 32px' }}>
          {/* Date label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: easeGentle }}
            className="mb-6 font-inter"
            style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}
          >
            Vandaag &mdash; {todayLabel}
          </motion.p>

          {/* Stats grid */}
          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <StatCard
              label="Registraties"
              value={stats.total}
              index={0}
            />
            <StatCard
              label="Groen"
              labelColor="#27AE60"
              value={stats.groen}
              valueColor="#27AE60"
              subtext={`${stats.percentages.groen}%`}
              index={1}
            />
            <StatCard
              label="Oranje"
              labelColor="#F39C12"
              value={stats.oranje}
              valueColor="#F39C12"
              subtext={`${stats.percentages.oranje}%`}
              index={2}
            />
            <StatCard
              label="Rood"
              labelColor="#E74C3C"
              value={stats.rood}
              valueColor="#E74C3C"
              subtext={`${stats.percentages.rood}%`}
              index={3}
            />
          </div>
        </section>

        {/* ====== Section 2: Emotion Timeline ====== */}
        <section style={{ padding: '32px 0' }}>
          <h2
            className="mb-6 font-poppins font-semibold text-white"
            style={{ fontSize: 24, lineHeight: 1.25 }}
          >
            Tijdlijn vandaag
          </h2>

          {isLoading ? (
            <div className="py-8 text-center">
              <Activity
                size={32}
                className="mx-auto animate-pulse"
                style={{ color: 'rgba(255,255,255,0.1)' }}
              />
            </div>
          ) : emotions.length === 0 ? (
            <EmptyTimeline />
          ) : (
            <div className="relative">
              {/* Timeline connector line */}
              <div
                className="absolute left-[88px] top-0 bottom-0"
                style={{
                  width: 2,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              />
              {emotions.map((item, i) => (
                <TimelineItem
                  key={item.id}
                  emotion={item.emotion}
                  createdAt={item.createdAt}
                  participantName={item.participantName}
                  index={i}
                />
              ))}
            </div>
          )}
        </section>

        {/* ====== Section 3: Active Alerts ====== */}
        <section style={{ padding: '32px 0 64px' }}>
          <h2
            className="mb-6 font-poppins font-semibold text-white"
            style={{ fontSize: 24, lineHeight: 1.25 }}
          >
            Actieve meldingen
          </h2>

          {alerts.length === 0 ? (
            <EmptyAlerts />
          ) : (
            alerts.map((alert, i) => (
              <AlertCard
                key={alert.id}
                id={alert.id}
                createdAt={alert.createdAt}
                participantName={alert.participantName}
                index={i}
                onMarkHandled={handleMarkHandled}
              />
            ))
          )}
        </section>
      </div>

      {/* ====== Section 4: Footer ====== */}
      <footer
        className="border-t border-white/[0.06] bg-[#0B193D]"
        style={{ padding: 32 }}
      >
        <div
          className="mx-auto flex w-full flex-col items-center justify-between gap-2 px-8 md:flex-row"
          style={{ maxWidth: 1200 }}
        >
          <span
            className="font-inter"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}
          >
            Dagbesteding EmotieCheck v1.0
          </span>
          <Link
            to="/"
            className="font-inter transition-colors duration-300 hover:text-white"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}
          >
            Terug naar check-in
          </Link>
        </div>
      </footer>
    </div>
  );
}
