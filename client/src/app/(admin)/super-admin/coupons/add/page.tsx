"use client";

import { protectCouponFormAction } from "@/actions/coupon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useCouponStore } from "@/components/storefront/checkout/state/useCouponStore";
import {
  Tag,
  Percent,
  Calendar,
  Sparkles,
  Zap,
  Ticket,
  Clock,
  Users,
  Shield,
  Key,
  Copy,
  Gift,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CouponHeader } from "@/components/super-admin/coupon/molecules/CouponHeader";
import { CouponPreview } from "@/components/super-admin/coupon/molecules/CouponPreview";
import { FormField } from "@/components/super-admin/coupon/atoms/CouponFormField";
import { DateValidation } from "@/components/super-admin/coupon/molecules/CouponDateValidation";
import {
  generateCouponCode,
  validateGeneratedCode,
} from "@/components/super-admin/coupon/utils/couponGenerator";
import { sentryTracker } from "@/lib/monitoring";

function SuperAdminManageCouponsPage() {
  const [formData, setFormData] = useState({
    code: "",
    discountPercent: 0,
    startDate: "",
    endDate: "",
    usageLimit: 0,
  });

  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const { createCoupon, isLoading } = useCouponStore();

  // Set default dates
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split("T")[0];

    setFormData((prev) => ({
      ...prev,
      startDate: prev.startDate || today,
      endDate: prev.endDate || nextMonthStr,
    }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("Percent") || name.includes("Limit")
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const handleGenerateCoupon = () => {
    setIsGenerating(true);
    try {
      const result = generateCouponCode();

      if (!validateGeneratedCode(result)) {
        console.warn("Generated code failed validation, regenerating...");
        return handleGenerateCoupon(); // try again
      }

      setFormData((prev) => ({ ...prev, code: result }));
      setGeneratedCodes((prev) => [result, ...prev.slice(0, 4)]);
    } catch (error) {
    sentryTracker(error, { source: "page" });
      console.error("Failed to generate the coupon", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (formData.code) {
      navigator.clipboard.writeText(formData.code);
      toast({
        title: "Copied to clipboard",
        description: "Coupon code copied successfully",
      });
    }
  };

  const handleCouponSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Date validation
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    // Form validation
    const checkCouponFormvalidation = await protectCouponFormAction();
    if (!checkCouponFormvalidation.success) {
      toast({
        title: "Validation Error",
        description: checkCouponFormvalidation.error,
        variant: "destructive",
      });
      return;
    }

    const couponData = {
      ...formData,
      discountPercent: parseFloat(formData.discountPercent.toString()),
      usageLimit: parseInt(formData.usageLimit.toString()) || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await createCoupon(couponData);
    if (result) {
      toast({
        title: "Coupon Created!",
        description: "Your futuristic coupon has been created successfully",
        className: "bg-success/10 border-success/20 text-success",
      });

      // Reset form
      setFormData({
        code: "",
        discountPercent: 0,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
          .toISOString()
          .split("T")[0],
        usageLimit: 0,
      });

      router.push("/super-admin/coupons/list");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-card/20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <CouponHeader />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-8">
            {/* Form Section */}
            <div className="glass-effect rounded-2xl p-6 border border-glass-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Coupon Details
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Configure your discount campaign
                  </p>
                </div>
              </div>

              <form onSubmit={handleCouponSubmit} className="space-y-6">
                {/* Code Generation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Coupon Code
                    </Label>
                    <Button
                      type="button"
                      onClick={handleGenerateCoupon}
                      disabled={isGenerating}
                      variant="outline"
                      size="sm"
                      className="border-border hover:border-primary"
                    >
                      <Sparkles
                        className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`}
                      />
                      {isGenerating ? "Generating..." : "Generate Code"}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      name="code"
                      placeholder="e.g., FUTURE20 or click Generate"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="flex-1 bg-input border-border font-mono"
                      required
                    />
                    <Button
                      type="button"
                      onClick={copyToClipboard}
                      variant="outline"
                      size="icon"
                      disabled={!formData.code}
                      className="border-border"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Recent Generated Codes */}
                  {generatedCodes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Recently generated:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {generatedCodes.map((code, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="cursor-pointer hover:border-primary hover:text-primary"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, code }))
                            }
                          >
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Discount Percentage */}
                <FormField
                  label="Discount Percentage"
                  name="discountPercent"
                  type="number"
                  placeholder="e.g., 20 for 20% off"
                  value={formData.discountPercent}
                  onChange={handleInputChange}
                  icon={<Percent className="h-4 w-4" />}
                  required
                  tooltip="Enter percentage discount (1-100)"
                />

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    icon={<Calendar className="h-4 w-4" />}
                    required
                  />

                  <FormField
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    icon={<Calendar className="h-4 w-4" />}
                    required
                  />
                </div>

                {/* Date Validation */}
                <DateValidation
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                />

                {/* Usage Limit */}
                <FormField
                  label="Usage Limit"
                  name="usageLimit"
                  type="number"
                  placeholder="0 for unlimited"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  icon={<Users className="h-4 w-4" />}
                  tooltip="Set 0 for unlimited usage"
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      Creating Coupon...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Gift className="h-5 w-5" />
                      Create Futuristic Coupon
                    </div>
                  )}
                </Button>
              </form>
            </div>

            {/* Tips Section */}
            <div className="glass-effect rounded-2xl p-6 border border-glass-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Pro Tips
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <span>
                    Use readable codes like "SUMMER25" for better brand recall
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span>
                    Set usage limits to prevent abuse of high-value coupons
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Create seasonal coupons aligned with marketing campaigns
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Percent className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <span>
                    Test different discount percentages to find optimal
                    conversion rates
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-8">
            {/* Preview Section */}
            <div className="sticky top-8">
              <div className="glass-effect rounded-2xl p-6 border border-glass-border mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-linear-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Live Preview
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      See how your coupon will appear to customers
                    </p>
                  </div>
                </div>

                <CouponPreview
                  code={formData.code}
                  discountPercent={formData.discountPercent}
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                  usageLimit={formData.usageLimit}
                />

                {/* Stats */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Strength</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-6 rounded-full ${
                            i < Math.min(formData.discountPercent / 20, 5)
                              ? "bg-linear-to-r from-primary to-secondary"
                              : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Estimated Impact
                    </span>
                    <span className="font-medium text-foreground">
                      {formData.discountPercent > 30
                        ? "High"
                        : formData.discountPercent > 15
                          ? "Medium"
                          : "Low"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Code Security</span>
                    <span className="font-medium text-success flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Strong
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="glass-effect rounded-2xl p-6 border border-glass-border">
                <h3 className="font-semibold text-foreground mb-4">
                  Coupon Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">
                      {formData.discountPercent}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Discount Rate
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-secondary">
                      {formData.usageLimit || "∞"}
                    </div>
                    <p className="text-xs text-muted-foreground">Max Uses</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-accent">
                      {formData.code ? "Active" : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                      {formData.startDate && formData.endDate
                        ? Math.floor(
                            (new Date(formData.endDate).getTime() -
                              new Date(formData.startDate).getTime()) /
                              (1000 * 60 * 60 * 24),
                          )
                        : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground">Days Valid</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminManageCouponsPage;
