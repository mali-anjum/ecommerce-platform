"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/site-header";
import { ShoppingAssistantWidget } from "@/components/assistant/ShoppingAssistantWidget";
import { useEffect, useState } from "react";

// Modular Components
const FloatingParticles = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="error-particle absolute animate-twinkle"
          style={
            {
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 5}s`,
              "--particle-opacity": `${Math.random() * 0.2 + 0.05}`,
              "--particle-blur": `${Math.random() * 2 + 1}px`,
            } as any
          }
        />
      ))}
    </div>
  );
};

const BackgroundGrid = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="error-grid absolute inset-0 opacity-[0.03]" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background" />
    </div>
  );
};

const RouteTransitionIndicator = ({ pathname }: { pathname: string }) => {
  const [prevPath, setPrevPath] = useState(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (prevPath !== pathname) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      setPrevPath(pathname);
      return () => clearTimeout(timer);
    }
  }, [pathname, prevPath]);

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent animate-shimmer" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-pulse" />
    </div>
  );
};

const LayoutContent = ({
  children,
  showHeader,
}: {
  children: React.ReactNode;
  showHeader: boolean;
}) => (
  <div className="min-h-screen bg-background text-foreground theme-transition relative">
    <BackgroundGrid isVisible={showHeader} />
    <FloatingParticles isVisible={showHeader} />

    <div className="relative z-10">
      {showHeader && <Header />}
      <main className="min-h-[calc(100vh-80px)]">{children}</main>
    </div>
  </div>
);

// Main Layout Component
const pathsNotToShowHeaders = ["/auth", "/super-admin", "/seller"];

function CommonLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showHeader = !pathsNotToShowHeaders.some((currentPath) =>
    pathname?.startsWith(currentPath),
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-primary border-r-secondary border-b-accent border-l-primary-light animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <RouteTransitionIndicator pathname={pathname || ""} />
      <LayoutContent showHeader={showHeader}>{children}</LayoutContent>

      {showHeader && <ShoppingAssistantWidget />}

      {/* Floating Navigation Helper */}
      {showHeader && (
        <div className="fixed bottom-8 right-8 z-40">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-12 h-12 rounded-full glass-effect border-glass-border hover:border-primary hover:scale-110 transition-all duration-300 flex items-center justify-center group"
            aria-label="Scroll to top"
          >
            <span className="text-foreground group-hover:text-primary transition-colors">
              ↑
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      )}

      {/* Theme-aware scrollbar */}
      <style jsx global>{`
        .theme-transition {
          transition:
            background-color 0.3s ease,
            color 0.3s ease,
            border-color 0.3s ease;
        }

        .glass-effect {
          backdrop-filter: blur(12px);
          background: hsl(var(--glass));
          border: 1px solid hsl(var(--glass-border));
          box-shadow:
            0 8px 32px var(--glow),
            inset 0 1px 0 var(--glass-border);
        }

        .neon-border {
          box-shadow:
            0 0 10px hsl(var(--primary)),
            inset 0 0 10px hsl(var(--primary-glow));
        }

        .animate-shimmer {
          background-size: 200% auto;
          animation: shimmer 2s linear infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
    </>
  );
}

export default CommonLayout;
