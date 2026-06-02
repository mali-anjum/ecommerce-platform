import { useEffect } from "react";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { ROUTES } from "@/lib/routes/api";
import { LoginFormData } from "@/components/schemas/loginSchema";

export const useLogin = () => {
  const { toast } = useToast();
  const { login, isLoading, user, error } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const targetPath =
      user.role === "SUPER_ADMIN"
        ? ROUTES.SUPER_ADMIN
        : user.role === "SELLER"
          ? ROUTES.SELLER
          : ROUTES.HOME;

    // Full navigation so middleware receives cookies set by /api/auth/login
    const timer = setTimeout(() => {
      window.location.assign(targetPath);
    }, 400);

    return () => clearTimeout(timer);
  }, [user]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const success = await login(data.email, data.password);

      if (success) {
        toast({
          title: "Access granted",
          description: "Welcome back! Redirecting to your dashboard...",
          className: "bg-primary/10 border-primary/20",
        });
      } else {
        throw new Error(error || "Authentication failed");
      }
    } catch (err) {
      toast({
        title: "Authentication error",
        description: err instanceof Error ? err.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  return {
    isLoading,
    isSubmitDisabled: isLoading,
    onSubmit,
  };
};
