"use client";

import { LoginBanner } from "@/components/auth/molecules/LoginBanner";
import { LoginForm } from "@/components/auth/organisms/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground theme-transition relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="error-grid absolute inset-0 opacity-5" />
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="error-particle absolute animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        <LoginBanner />
        <LoginForm />
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground/50">
        <p>© 2024 Futuristic Auth System. All rights reserved.</p>
      </div>
    </div>
  );
}