import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { MessageCircle, Activity } from 'lucide-react';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmotionLogEntry {
  time: string;
  emotion: 'groen' | 'oranje' | 'rood';
}

const mockEmotionLogs: EmotionLogEntry[] = [
  { time: '09:15', emotion: 'groen' },
  { time: '10:30', emotion: 'oranje' },
  { time: '11:45', emotion: 'rood' },
  { time: '13:00', emotion: 'groen' },
  { time: '14:20', emotion: 'groen' },
];

const emotionBadgeConfig = {
  groen: { bg: 'rgba(39, 174, 96, 0.1)', text: '#27AE60', label: 'Goed' },
  oranje: { bg: 'rgba(243, 156, 18, 0.1)', text: '#F39C12', label: 'Matig' },
  rood: { bg: 'rgba(231, 76, 60, 0.1)', text: '#E74C3C', label: 'Niet goed' },
};

export default function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleTestMessage = () => {
    // eslint-disable-next-line no-console
    console.log('Test WhatsApp message to:', phoneNumber || '+31 6 12 34 56 78');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="overflow-y-auto bg-white font-inter"
        style={{
          width: 'clamp(320px, 90vw, 420px)',
          padding: '48px 32px',
          borderLeft: 'none',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.1)',
        }}
      >
        {/* Panel Header */}
        <SheetHeader className="mb-8">
          <SheetTitle
            className="font-poppins font-semibold"
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              color: '#0B193D',
            }}
          >
            Instellingen
          </SheetTitle>
          <SheetDescription
            className="font-inter"
            style={{
              fontSize: 16,
              color: '#29445A',
            }}
          >
            Dagbesteding EmotieCheck
          </SheetDescription>
        </SheetHeader>

        {/* WhatsApp Configuration Section */}
        <section className="mb-8">
          <h3
            className="font-inter font-semibold uppercase"
            style={{
              fontSize: 14,
              color: '#0B193D',
              letterSpacing: '0.04em',
            }}
          >
            WhatsApp-meldingen
          </h3>
          <div
            className="my-4"
            style={{ height: 1, backgroundColor: '#E6EDE8' }}
          />

          {/* Phone Number Input */}
          <div className="mb-4">
            <label
              className="mb-2 block font-inter font-medium"
              style={{ fontSize: 14, color: '#29445A' }}
            >
              Telefoonnummer zorgmedewerker
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+31 6 12 34 56 78"
              className="w-full font-inter transition-colors duration-200 focus:outline-none"
              style={{
                border: '2px solid #E6EDE8',
                borderRadius: 12,
                padding: '16px',
                fontSize: 16,
                color: '#0B193D',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0B193D';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E6EDE8';
              }}
            />
          </div>

          {/* Test Button */}
          <button
            onClick={handleTestMessage}
            className="flex w-full items-center justify-center gap-2 font-inter font-semibold text-white transition-opacity duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0B193D] focus-visible:ring-offset-2"
            style={{
              backgroundColor: '#0B193D',
              borderRadius: 9999,
              padding: '14px 32px',
              fontSize: 16,
              cursor: 'pointer',
            }}
            type="button"
          >
            <MessageCircle size={18} />
            Testbericht versturen
          </button>
        </section>

        {/* Emotion Log Section */}
        <section className="mb-8">
          <h3
            className="font-inter font-semibold uppercase"
            style={{
              fontSize: 14,
              color: '#0B193D',
              letterSpacing: '0.04em',
            }}
          >
            Registraties vandaag
          </h3>
          <div
            className="my-4"
            style={{ height: 1, backgroundColor: '#E6EDE8' }}
          />

          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} color="#29445A" />
            <span className="font-inter font-medium" style={{ fontSize: 14, color: '#29445A' }}>
              {mockEmotionLogs.length} registraties
            </span>
          </div>

          {/* Log List */}
          <div>
            {mockEmotionLogs.length > 0 ? (
              mockEmotionLogs.map((entry, index) => {
                const badge = emotionBadgeConfig[entry.emotion];
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #F5F1ED',
                    }}
                  >
                    <span
                      className="font-inter font-medium"
                      style={{ fontSize: 14, color: '#29445A' }}
                    >
                      {entry.time}
                    </span>
                    <span
                      className="font-inter font-semibold"
                      style={{
                        fontSize: 12,
                        backgroundColor: badge.bg,
                        color: badge.text,
                        padding: '4px 12px',
                        borderRadius: 9999,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <p
                className="py-4 text-center font-inter italic"
                style={{ fontSize: 14, color: '#29445A' }}
              >
                Nog geen registraties vandaag.
              </p>
            )}
          </div>
        </section>

        {/* System Info Section */}
        <section
          className="mt-auto pt-8"
          style={{ borderTop: '1px solid #E6EDE8' }}
        >
          <p
            className="font-inter"
            style={{ fontSize: 13, color: '#29445A', opacity: 0.6 }}
          >
            Versie 1.0.0
          </p>
          <p
            className="mt-1 font-inter"
            style={{ fontSize: 13, color: '#29445A', opacity: 0.6 }}
          >
            Laatste synchronisatie: zojuist
          </p>
        </section>
      </SheetContent>
    </Sheet>
  );
}
