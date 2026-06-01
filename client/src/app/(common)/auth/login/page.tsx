"use client";

import { Suspense } from "react";
import { LoginBanner } from "@/components/auth/molecules/LoginBanner";
import { LoginForm } from "@/components/auth/organisms/LoginForm";
import { LoginOAuthAlert } from "@/components/auth/molecules/LoginOAuthAlert";

/** Fixed positions avoid Math.random() hydration mismatch in dev. */
const LOGIN_PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  top: `${(i * 17 + 11) % 100}%`,
  left: `${(i * 23 + 7) % 100}%`,
  size: `${(i % 3) + 1}px`,
  delay: `${(i % 5) * 0.6}s`,
}));

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground theme-transition relative overflow-hidden">
      <Suspense fallback={null}>
        <LoginOAuthAlert />
      </Suspense>

      <div className="fixed inset-0 pointer-events-none">
        <div className="error-grid absolute inset-0 opacity-5" />
        {LOGIN_PARTICLES.map((particle, i) => (
          <div
            key={i}
            className="error-particle absolute animate-twinkle"
            style={{
              top: particle.top,
              left: particle.left,
              width: particle.size,
              height: particle.size,
              animationDelay: particle.delay,
            }}
          />
        ))}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        <LoginBanner />
        <LoginForm />
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground/50">
        <p>© 2024 Futuristic Auth System. All rights reserved.</p>
      </div>
    </div>
  );
}
