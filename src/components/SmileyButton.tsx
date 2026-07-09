import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface SmileyButtonProps {
  emotion: 'groen' | 'oranje' | 'rood';
  emoji: string;
  label: string;
  color: string;
  onClick: () => void;
  isVisible: boolean;
  index: number;
}

export default function SmileyButton({
  emoji,
  label,
  color,
  onClick,
  isVisible,
  index,
}: SmileyButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Entrance animation
  useEffect(() => {
    if (!buttonRef.current) return;

    if (isVisible) {
      // Reset initial state
      gsap.set(buttonRef.current, {
        opacity: isVisible ? 1 : 0,
        y: 30,
        scale: 0.9,
      });

      // Entrance animation with stagger delay
      const tl = gsap.timeline({ delay: 0.8 + index * 0.15 });
      tl.to(buttonRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      });
      timelineRef.current = tl;
    } else {
      // Exit animation
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      gsap.to(buttonRef.current, {
        opacity: isVisible ? 1 : 0,
        scale: 0.8,
        duration: 0.4,
        ease: 'power2.out',
      });
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [isVisible, index]);

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
        opacity: isVisible ? 1 : 0,
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
