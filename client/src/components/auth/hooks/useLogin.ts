import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/utils/routes/api"
import { LoginFormData } from "@/components/schemas/loginSchema";

export const useLogin = () => {
  const [isWarming, setIsWarming] = useState(false);
  const { toast } = useToast();
  const { login, isLoading, user, error } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log("🎯 User authenticated, redirecting...");
      const targetPath =
        user.role === "SUPER_ADMIN"
          ? ROUTES.SUPER_ADMIN
          : user.role === "SELLER"
            ? ROUTES.SELLER
            : ROUTES.HOME;
      
      setTimeout(() => {
        router.push(targetPath);
      }, 500);
    }
  }, [user, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const success = await login(data.email, data.password);

      if (success) {
        toast({
          title: "🔐 Access Granted",
          description: "Welcome back! Redirecting to dashboard...",
          className: "bg-primary/10 border-primary/20",
        });
      } else {
        throw new Error(error || "Authentication failed");
      }
    } catch (err) {
      toast({
        title: "⚠️ Authentication Error",
        description: err instanceof Error ? err.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  return {
    isWarming,
    isLoading,
    isSubmitDisabled: isLoading || isWarming,
    onSubmit,
  };
};