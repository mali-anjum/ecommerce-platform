import { useState } from "react";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { RegisterFormData } from "@/components/schemas/registerSchema";
import { protectSignUpAction } from "@/actions/auth";

export const useRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { register } = useAuthStore();
  const router = useRouter();

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    
    try {
      // First level validation - check if email exists
      const checkFirstLevelOfValidation = await protectSignUpAction(data.email);
      
      if (!checkFirstLevelOfValidation.success) {
        toast({
          title: "⚠️ Registration Error",
          description: checkFirstLevelOfValidation.error,
          variant: "destructive",
        });
        return { success: false, error: checkFirstLevelOfValidation.error };
      }

      // Register the user
      const userId = await register(data.name, data.email, data.password);
      
      if (userId) {
        toast({
          title: "🎉 Account Created!",
          description: "Your futuristic account is ready. Redirecting to login...",
          className: "bg-primary/10 border-primary/20",
        });
        
        // Add a celebratory effect and redirect
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
        
        return { success: true, userId };
      }
    } catch (error) {
      toast({
        title: "🚨 Registration Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    onSubmit,
  };
};