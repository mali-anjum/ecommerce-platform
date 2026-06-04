"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Home, 
  Zap, 
  Sparkles, 
  AlertTriangle, 
  Globe, 
  Satellite, 
  Orbit,
  Navigation,
  SatelliteDish,
  Binary,
  Cpu,
  AlertCircle,
  RefreshCw,
  Compass,
  Radar
} from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ==================== MODULAR COMPONENTS ====================

// 1. Animated Background Component
function Animated404Background() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
  }>>([]);

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 2 + 1,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* Space gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-card/50 to-background" />
      
      {/* Animated nebula */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-secondary/5 animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/3 h-48 w-48 rounded-full bg-accent/5 animate-pulse delay-500" />
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary/20 animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.speed * 3}s`,
            animationDelay: `${particle.id * 0.2}s`,
          }}
        />
      ))}
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>
      
      {/* Radar scan line */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent animate-radar-scan" />
      </div>
    </div>
  );
}

// 2. Error Code Display Component
function ErrorCodeDisplay() {
  const [code, setCode] = useState("000");
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Animate the error code
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setCode("404");
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {/* Glowing effect */}
      <div className="absolute -inset-8 bg-linear-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-full blur-3xl animate-pulse" />
      
      {/* Error code display */}
      <div className="relative">
        <div className="text-[180px] md:text-[240px] font-black leading-none">
          <span className="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {code.split("").map((digit, index) => (
              <span
                key={index}
                className={`inline-block ${
                  isAnimating ? "animate-bounce" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {digit}
              </span>
            ))}
          </span>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4">
          <Satellite className="h-8 w-8 text-primary animate-spin-slow" />
        </div>
        <div className="absolute -bottom-4 -right-4">
          <Orbit className="h-8 w-8 text-secondary animate-spin-slow" />
        </div>
        <div className="absolute top-1/2 -right-8">
          <Binary className="h-6 w-6 text-accent" />
        </div>
      </div>
    </div>
  );
}

// 3. Search Recovery Component
function SearchRecovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();

  const popularPages = [
    { name: "Home", path: "/", icon: Home },
    { name: "Shop", path: "/products", icon: Zap },
    { name: "New Arrivals", path: "/new-arrivals", icon: Sparkles },
    { name: "Account", path: "/account", icon: Globe },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <Card className="glass-effect border border-glass-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Navigation className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Navigation Recovery</h3>
            <p className="text-sm text-muted-foreground">Let's get you back on track</p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for pages, products, or help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input border-border"
            />
            <Button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Popular Destinations
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {popularPages.map((page) => {
              const Icon = page.icon;
              return (
                <Link
                  key={page.name}
                  href={page.path}
                  className="p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-card flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <span className="font-medium text-foreground">
                      {page.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 4. System Diagnostics Component
function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState([
    { name: "Network Connection", status: "online", progress: 100 },
    { name: "Server Status", status: "optimal", progress: 95 },
    { name: "Database", status: "connected", progress: 90 },
    { name: "Security Protocols", status: "active", progress: 100 },
  ]);

  return (
    <Card className="glass-effect border border-glass-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-linear-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
            <Radar className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">System Diagnostics</h3>
            <p className="text-sm text-muted-foreground">All systems operational</p>
          </div>
        </div>

        <div className="space-y-4">
          {diagnostics.map((diag, index) => (
            <div key={diag.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{diag.name}</span>
                <Badge className={
                  diag.status === "online" || diag.status === "optimal" || diag.status === "active"
                    ? "bg-success/20 text-success border-success/20"
                    : "bg-warning/20 text-warning border-warning/20"
                }>
                  {diag.status}
                </Badge>
              </div>
              <Progress value={diag.progress} className="h-1" />
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <p className="text-sm text-muted-foreground">
              This page may have been moved or deleted. Our team has been notified.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 5. Error Details Component
function ErrorDetails() {
  const [errorDetails, setErrorDetails] = useState({
    timestamp: new Date().toISOString(),
    path: typeof window !== "undefined" ? window.location.pathname : "/",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  });

  return (
    <div className="mt-6">
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          <Cpu className="h-4 w-4" />
          Technical Details
          <span className="ml-auto transform group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>
        <div className="mt-3 p-4 rounded-lg bg-card border border-border font-mono text-xs">
          <pre className="whitespace-pre-wrap text-muted-foreground">
{`Error Code: 404
Timestamp: ${errorDetails.timestamp}
Path: ${errorDetails.path}
User Agent: ${errorDetails.userAgent.slice(0, 50)}...
Status: Page Not Found
Resolution: Navigation recovery initiated`}
          </pre>
        </div>
      </details>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function GlobalNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <Animated404Background />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          {/* Error Code */}
          <ErrorCodeDisplay />

          {/* Error Message */}
          <div className="max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Lost in the Digital Cosmos
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              The gravitational coordinates you're searching for have drifted into the void. 
              Our quantum navigation systems couldn't locate this page.
            </p>
            
            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                onClick={() => router.push("/")}
                className="bg-linear-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-primary-foreground"
                size="lg"
              >
                <Home className="h-5 w-5 mr-2" />
                Return to Home Base
              </Button>
              
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="border-border hover:border-primary"
                size="lg"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Navigate Back
              </Button>
            </div>
          </div>
        </div>

        {/* Recovery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <SearchRecovery />
            <ErrorDetails />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <SystemDiagnostics />
            
            {/* Support Card */}
            <Card className="glass-effect border border-glass-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-linear-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                    <SatelliteDish className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Need Assistance?</h3>
                    <p className="text-sm text-muted-foreground">Our support team is ready to help</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start border-border">
                    <Zap className="h-4 w-4 mr-2" />
                    Live Chat Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-border">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Submit a Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground">
              Error logged. Our cosmic engineers are investigating.
            </span>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="fixed bottom-8 left-8 animate-float">
        <div className="h-4 w-4 rounded-full bg-primary/20 animate-pulse" />
      </div>
      <div className="fixed top-8 right-8 animate-float" style={{ animationDelay: "1s" }}>
        <div className="h-3 w-3 rounded-full bg-secondary/20 animate-pulse" />
      </div>
      <div className="fixed bottom-24 right-24 animate-float" style={{ animationDelay: "2s" }}>
        <div className="h-2 w-2 rounded-full bg-accent/20 animate-pulse" />
      </div>
    </div>
  );
}