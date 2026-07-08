import { useLocation } from 'react-router';
import { Settings } from 'lucide-react';

interface NavbarProps {
  onSettingsClick?: () => void;
}

export default function Navbar({ onSettingsClick }: NavbarProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  // On the home page, the settings gear is handled by the page itself
  if (isHome) return null;

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between bg-[#0B193D] px-6 py-4"
    >
      <h1
        className="font-poppins font-semibold text-white"
        style={{ fontSize: 20 }}
      >
        Dagbesteding EmotieCheck
      </h1>
      {onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="transition-opacity duration-300 hover:opacity-100 focus:outline-none"
          style={{ opacity: 0.4 }}
          type="button"
          aria-label="Instellingen"
        >
          <Settings size={24} color="#FFFFFF" />
        </button>
      )}
    </nav>
  );
}
