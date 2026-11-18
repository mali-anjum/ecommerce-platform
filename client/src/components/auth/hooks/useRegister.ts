import { useState } from "react";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { useRouter } from "next/navigation";
import { RegisterFormData } from "@/components/schemas/registerSchema";
import { protectSignUpAction } from "@/actions/auth";
import { sentryTracker } from "@/lib/monitoring";

export const useRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { register } = useAuthStore();
  const router = useRouter();

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const checkFirstLevelOfValidation = await protectSignUpAction(data.email);

      if (!checkFirstLevelOfValidation.success) {
        toast({
          title: "Registration error",
          description: checkFirstLevelOfValidation.error,
          variant: "destructive",
        });
        return { success: false, error: checkFirstLevelOfValidation.error };
      }

      const userId = await register(data.name, data.email, data.password);

      if (!userId) {
        throw new Error("Registration failed");
      }

      toast({
        title: "Account created",
        description: "Your account is ready. Redirecting to login...",
        className: "bg-primary/10 border-primary/20",
      });

      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);

      return { success: true, userId };
    } catch (error) {
    sentryTracker(error, { source: "useRegister" });
      toast({
        title: "Registration failed",
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    onSubmit,
  };
};
