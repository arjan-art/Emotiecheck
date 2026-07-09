import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface SmileyButtonProps {
  emotion: 'groen' | 'oranje' | 'rood';
  emoji: string;
  label: string;
  color: string;
  onClick: () => void;
  isVisible?: boolean;
}

export default function SmileyButton({
  emotion,
  emoji,
  label,
  color,
  onClick,
  isVisible = true,
}: SmileyButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current && isVisible) {
      gsap.fromTo(
        buttonRef.current,
        { opacity: 0, y: 30, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
        }
      );
    }
  }, [isVisible]);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-full bg-white transition-all duration-200 hover:-translate-y-1 active:translate-y-0.5 active:scale-[0.97]"
      style={{
        width: 'clamp(160px, 25vw, 200px)',
        height: 'clamp(160px, 25vw, 200px)',
        border: `4px solid ${color}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        opacity: isVisible ? 1 : 0,
        cursor: 'pointer',
      }}
    >
      <span
        className="select-none"
        style={{
          fontSize: 'clamp(64px, 8vw, 96px)',
          lineHeight: 1,
        }}
      >
        {emoji}
      </span>
      <span
        className="mt-3 select-none text-center font-inter font-medium"
        style={{
          fontSize: 'clamp(14px, 2vw, 18px)',
          color: '#0B193D',
        }}
      >
        {label}
      </span>
    </button>
  );
}
