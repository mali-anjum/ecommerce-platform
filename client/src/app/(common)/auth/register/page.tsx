"use client";

import { LoginBanner } from "@/components/auth/molecules/LoginBanner"; // Reused from login
import { RegisterForm } from "@/components/auth/organisms/RegisterForm";
import "@/styles/login.css"; // Import animations
import { seededRandomRows } from "@/lib/seededRandom";

// Precomputed so server and client render identical particles.
const PARTICLES = seededRandomRows(20, 6, 11);

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background text-foreground theme-transition relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="error-grid absolute inset-0 opacity-5" />
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="error-particle absolute animate-float"
            style={{
              top: `${p[0] * 100}%`,
              left: `${p[1] * 100}%`,
              width: `${p[2] * 4 + 2}px`,
              height: `${p[3] * 4 + 2}px`,
              animationDelay: `${p[4] * 3}s`,
              animationDuration: `${p[5] * 6 + 4}s`,
              opacity: 0.15,
            }}
          />
        ))}
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-secondary to-transparent" />
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        <LoginBanner 
          title="Join the Revolution"
          description="Create your account and unlock access to cutting-edge features, exclusive content, and a personalized futuristic experience."
          showSparkles={true}
        />
        <RegisterForm />
      </div>

      {/* Footer */}
      <div className="absolute bottom-2 md:bottom-4 left-0 right-0 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/50">
          <span className="w-1 h-1 rounded-full bg-primary/30 animate-pulse" />
          <span>Secure Registration System</span>
          <span className="w-1 h-1 rounded-full bg-secondary/30 animate-pulse animation-delay-1000" />
        </div>
      </div>
    </div>
  );
}