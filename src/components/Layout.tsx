import type { ReactNode } from 'react';
import BlobBackground from './BlobBackground';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  showBlobBackground?: boolean;
}

export default function Layout({ children, showBlobBackground = true }: LayoutProps) {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden">
      {/* Three.js blob background — behind everything */}
      {showBlobBackground && <BlobBackground />}

      {/* Main content layer */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <main className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
