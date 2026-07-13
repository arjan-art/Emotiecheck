import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { Mail } from 'lucide-react';

interface ConfirmationCardProps {
  emotion: 'groen' | 'oranje' | 'rood';
  onReset: () => void;
  timeLeft: number;
}

const emotionConfig = {
  groen: {
    emoji: '😊',
    color: '#27AE60',
    heading: 'Fijn om te horen!',
    body: 'We zijn blij dat je je goed voelt. Geniet van je dag!',
  },
  oranje: {
    emoji: '😐',
    color: '#F39C12',
    heading: 'Dank je wel voor het doorgeven.',
    body: 'We hopen dat je dag nog beter wordt. We zijn er voor je.',
  },
  rood: {
    emoji: '😢',
    color: '#E74C3C',
    heading: 'Dank je wel dat je het hebt doorgegeven.',
    body: 'We hebben een email gestuurd naar de zorgmedewerker. Iemand komt zo snel mogelijk naar je toe.',
  },
};

const TOTAL_AUTO_RESET_TIME = 30;

export default function ConfirmationCard({ emotion, onReset, timeLeft }: ConfirmationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const config = emotionConfig[emotion];
  const [showBanner, setShowBanner] = useState(false);

  // Card entrance animation
  useEffect(() => {
    if (!cardRef.current) return;

    // Card scale-in with elastic easing
    gsap.fromTo(
      cardRef.current,
      { scale: 0.8, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
        delay: 0.2,
      }
    );

    // Show Email banner after delay (Rood only)
    if (emotion === 'rood') {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [emotion]);

  // Particles burst animation
  useEffect(() => {
    if (!particlesRef.current) return;

    const particles = particlesRef.current.children;
    const tl = gsap.timeline({ delay: 0.3 });

    Array.from(particles).forEach((particle, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 60 + Math.random() * 80;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 40;

      gsap.set(particle, {
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
      });

      tl.to(
        particle,
        {
          x,
          y,
          opacity: 0,
          scale: 0.5,
          duration: 1.2,
          ease: 'power2.out',
        },
        i * 0.05
      );
    });

    return () => {
      tl.kill();
    };
  }, []);

  const handleReset = useCallback(() => {
    if (!cardRef.current) return;

    // Exit animation
    gsap.to(cardRef.current, {
      scale: 0.9,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: onReset,
    });
  }, [onReset]);

  const progressPercent = (timeLeft / TOTAL_AUTO_RESET_TIME) * 100;

  return (
    <div className="relative flex flex-col items-center">
      {/* Particles container */}
      <div
        ref={particlesRef}
        className="pointer-events-none absolute top-1/2 left-1/2 z-10"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: config.color,
              left: -4,
              top: -4,
            }}
          />
        ))}
      </div>

      {/* Confirmation Card */}
      <div
        ref={cardRef}
        className="relative w-[90vw] max-w-[520px] overflow-hidden bg-white text-center"
        style={{
          borderRadius: 32,
          padding: 48,
          boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
          opacity: 0,
        }}
        role="alert"
        aria-live="polite"
      >
        {/* Confirmation Icon */}
        <div
          className="select-none"
          style={{ fontSize: 80, lineHeight: 1 }}
          role="img"
          aria-hidden="true"
        >
          {config.emoji}
        </div>

        {/* Heading */}
        <h2
          className="font-poppins font-bold mt-6"
          style={{
            fontSize: 'clamp(32px, 4vw, 56px)',
            color: '#0B193D',
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
          }}
        >
          {config.heading}
        </h2>

        {/* Body */}
        <p
          className="font-inter mt-4"
          style={{
            fontSize: 'clamp(18px, 2vw, 22px)',
            color: '#29445A',
            lineHeight: 1.5,
          }}
        >
          {config.body}
        </p>

        {/* Email Alert Banner (Rood only) */}
        {emotion === 'rood' && showBanner && (
          <div
            className="mt-8 flex items-center gap-4"
            style={{
              backgroundColor: '#E6EDE8',
              borderLeft: '6px solid #27AE60',
              borderRadius: 16,
              padding: 24,
              animation: 'fadeSlideIn 0.5s ease-out',
            }}
          >
            <Mail
              size={28}
              color="#27AE60"
              className="shrink-0"
              style={{
                animation: 'gentlePulse 2s ease-in-out infinite',
                animationDelay: '1s',
              }}
            />
            <span
              className="font-inter font-semibold text-left"
              style={{
                fontSize: 14,
                color: '#0B193D',
                letterSpacing: '0.04em',
              }}
            >
              Email-melding verstuurd naar zorgmedewerker
            </span>
          </div>
        )}

        {/* Reset Button */}
        <div className="mt-12">
          <button
            onClick={handleReset}
            className="font-inter font-semibold transition-all duration-300 hover:bg-[#0B193D] hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0B193D] focus-visible:ring-offset-2"
            style={{
              backgroundColor: 'transparent',
              border: '2px solid #0B193D',
              color: '#0B193D',
              borderRadius: 9999,
              padding: '16px 48px',
              fontSize: 16,
              cursor: 'pointer',
            }}
            type="button"
          >
            Opnieuw
          </button>
        </div>

        {/* Auto-reset progress bar */}
        <div
          className="absolute bottom-0 left-0"
          style={{
            height: 4,
            width: `${progressPercent}%`,
            backgroundColor: config.color,
            transition: 'width 1s linear',
          }}
        />
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
