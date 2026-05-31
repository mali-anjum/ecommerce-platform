import { Shield } from "lucide-react";

export const SecurityBadge = () => (
  <div className="rounded-xl p-4 glass-effect border-glass-border mb-6">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Shield className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Secure Authentication</p>
        <p className="text-sm text-muted-foreground">Enterprise-grade security</p>
      </div>
    </div>
  </div>
);