import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface SmileyButtonProps {
  emotion: 'groen' | 'oranje' | 'rood';
  emoji: string;
  label: string;
  color: string;
  onClick: () => void;
}

export default function SmileyButton({
  emoji,
  label,
  color,
  onClick,
}: SmileyButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!buttonRef.current) return;

    gsap.fromTo(
      buttonRef.current,
      { opacity: 0, y: 30, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
        delay: 0.3,
      }
    );
  }, []);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-full bg-white font-inter transition-shadow duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2"
      style={{
        width: 'clamp(160px, 25vw, 200px)',
        height: 'clamp(160px, 25vw, 200px)',
        border: `4px solid ${color}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(2px) scale(0.97)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      aria-label={label}
      type="button"
    >
      <span
        className="select-none"
        style={{
          fontSize: 'clamp(64px, 8vw, 96px)',
          lineHeight: 1,
        }}
        role="img"
        aria-hidden="true"
      >
        {emoji}
      </span>
      <span
        className="mt-3 text-center font-inter font-semibold select-none"
        style={{
          fontSize: 'clamp(13px, 1.5vw, 15px)',
          color,
          letterSpacing: '0.04em',
          maxWidth: '80%',
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
    </button>
  );
}
