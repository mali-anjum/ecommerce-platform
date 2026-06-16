import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Calendar, Clock, Copy, Shield, Tag, Users, Zap } from "lucide-react";

interface CouponPreviewProps {
  code: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
}

export function CouponPreview({ 
  code, 
  discountPercent, 
  startDate, 
  endDate, 
  usageLimit 
}: CouponPreviewProps) {
  const isValidCoupon = code && discountPercent > 0 && startDate && endDate;
  
  if (!isValidCoupon) return null;

  const getDateStatus = () => {
    if (!startDate || !endDate) return 'inactive';
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    return 'active';
  };

  const status = getDateStatus();
  const statusColors = {
    active: 'bg-success/20 text-success border-success/20',
    upcoming: 'bg-warning/20 text-warning border-warning/20',
    expired: 'bg-destructive/20 text-destructive border-destructive/20',
    inactive: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className="glass-effect border border-glass-border overflow-hidden">
      <div className="relative">
        {/* Coupon Cut Pattern */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-secondary to-accent" />
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-6 w-4 bg-background rounded-r-full" />
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-4 bg-background rounded-l-full" />
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge className={statusColors[status as keyof typeof statusColors]}>
              {status === 'active' ? (
                <Zap className="h-3 w-3 mr-1" />
              ) : status === 'upcoming' ? (
                <Clock className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            
            <div className="text-xs text-muted-foreground">
              ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
          </div>

          {/* Coupon Code Display */}
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-3 rounded-xl bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <code className="text-2xl font-bold tracking-widest text-foreground font-mono">
                  {code}
                </code>
                <Copy className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
              </div>
            </div>
          </div>

          {/* Discount Display */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-linear-to-r from-primary to-secondary">
              <span className="text-4xl font-bold text-primary-foreground">
                {discountPercent}%
              </span>
              <span className="ml-2 text-lg text-primary-foreground/80">OFF</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Maximum discount applies
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Start Date
              </div>
              <p className="font-medium text-foreground">
                {new Date(startDate).toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                End Date
              </div>
              <p className="font-medium text-foreground">
                {new Date(endDate).toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                Usage Limit
              </div>
              <p className="font-medium text-foreground">
                {usageLimit || '∞'} uses
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                Security
              </div>
              <p className="font-medium text-foreground">
                Auto-generated
              </p>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}