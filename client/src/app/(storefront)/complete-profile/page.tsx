"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "@/components/auth/atoms/FormInput";
import { Button } from "@/components/ui/button";
import { useAddressStore } from "@/components/storefront/checkout/state/useAddressStore";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { useToast } from "@/components/ui/hooks/use-toast";
import { MapPin, Phone, User } from "lucide-react";
import {
  completeProfileSchema,
  type CompleteProfileForm,
} from "@/lib/validation/completeProfileSchema";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, fetchMe, completeProfile } = useAuthStore();
  const { createAddress } = useAddressStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompleteProfileForm>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      name: "",
      phone: "",
      country: "",
      city: "",
      postalCode: "",
      address: "",
    },
  });

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user?.name) {
      reset((values) => ({ ...values, name: user.name ?? "" }));
    }
  }, [user, reset]);

  useEffect(() => {
    if (!user) return;
    if (user.profileComplete !== false) {
      router.replace("/home");
    }
  }, [user, router]);

  const onSubmit = async (data: CompleteProfileForm) => {
    setIsSubmitting(true);
    try {
      const created = await createAddress({
        name: data.name,
        phone: data.phone,
        country: data.country,
        city: data.city,
        postalCode: data.postalCode,
        address: data.address,
        isDefault: true,
      });

      if (!created) {
        throw new Error("Could not save your address");
      }

      const ok = await completeProfile();
      if (!ok) {
        throw new Error("Could not mark your profile as complete");
      }

      toast({
        title: "Profile complete",
        description: "You can now continue shopping and checkout.",
      });
      router.replace("/home");
    } catch (error) {
      toast({
        title: "Could not save profile",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-card/80 p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Complete your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your shipping details before checkout.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            label="Full name"
            icon={User}
            {...register("name")}
            error={errors.name}
            disabled={isSubmitting}
          />
          <InputField
            label="Phone number"
            icon={Phone}
            {...register("phone")}
            error={errors.phone}
            disabled={isSubmitting}
          />
          <InputField
            label="Country"
            icon={MapPin}
            {...register("country")}
            error={errors.country}
            disabled={isSubmitting}
          />
          <InputField
            label="City"
            icon={MapPin}
            {...register("city")}
            error={errors.city}
            disabled={isSubmitting}
          />
          <InputField
            label="Postal code"
            icon={MapPin}
            {...register("postalCode")}
            error={errors.postalCode}
            disabled={isSubmitting}
          />
          <InputField
            label="Street address"
            icon={MapPin}
            {...register("address")}
            error={errors.address}
            disabled={isSubmitting}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save and continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
