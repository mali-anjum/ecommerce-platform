import { Shield, Zap, Rocket, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Secure Account",
    description: "Military-grade encryption",
    color: "primary"
  },
  {
    icon: Zap,
    title: "Fast Onboarding",
    description: "Get started in seconds",
    color: "secondary"
  },
  {
    icon: Rocket,
    title: "Exclusive Features",
    description: "Access cutting-edge tools",
    color: "accent"
  },
  {
    icon: Sparkles,
    title: "Personalized Experience",
    description: "Tailored just for you",
    color: "primary"
  }
];

export const BenefitsGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
    {benefits.map((benefit, index) => (
      <div
        key={index}
        className="flex items-start gap-3 p-3 rounded-lg glass-effect border-glass-border hover:border-primary/30 transition-all duration-300 group hover:scale-105"
      >
        <div className={`w-8 h-8 rounded-full bg-${benefit.color}/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <benefit.icon className={`w-4 h-4 text-${benefit.color}`} />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{benefit.title}</p>
          <p className="text-xs text-muted-foreground">{benefit.description}</p>
        </div>
      </div>
    ))}
  </div>
);