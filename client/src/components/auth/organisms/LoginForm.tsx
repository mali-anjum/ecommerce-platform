"use client";

import { useForm, FormProvider } from "react-hook-form"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Mail, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { loginSchema, LoginFormData } from "@/components/schemas/loginSchema";
import { ROUTES } from "@/lib/routes/api";
import { InputField } from "@/components/auth/atoms/FormInput";
import { LoadingButton } from "@/components/auth/atoms/LoadingButton";
import { SecurityBadge } from "@/components/auth/atoms/SecurityBadge";
import { FeaturesGrid } from "@/components/auth/molecules/FeaturesGrid";
import { ThemeTogglePlaceholder } from "@/components/auth/atoms/ThemeTogglerPlaceHolder";
import { useLogin } from "@/components/auth/hooks/useLogin";
import { GoogleOAuthButton } from "@/components/auth/molecules/GoogleOAuthButton";

export const LoginForm = () => {
  const { isLoading, isSubmitDisabled, onSubmit } = useLogin();

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "ali@gmail.com",
      password: "123456",
    },
  });

  const { setFocus } = methods;
  const { register, formState: { errors } } = methods;

  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  return (
    <FormProvider {...methods}> {/* 👈 Wrap with FormProvider */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12 relative min-h-screen lg:min-h-0">
        <ThemeTogglePlaceholder />
        
        <div className="max-w-md w-full mx-auto">
          
          {/* Logo Section */}
          <div className="flex justify-center mb-8 group">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500" />
              <Image 
                src="/images/logo.webp"
                width={180} 
                height={45} 
                alt="Company Logo" 
                priority 
                className="relative z-10 max-w-[180px] h-auto"
                style={{ width: "auto", height: "auto" }}
                onError={(e) => {
                  console.error('Logo failed to load');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
          
          <SecurityBadge />
          
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <InputField
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isSubmitDisabled}
              {...register("email")}
              error={errors.email}
            />
            
            <InputField
              label="Password"
              type="password"
              icon={Lock}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isSubmitDisabled}
              {...register("password")}
              error={errors.password}
            />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-primary hover:text-primary-light transition-colors flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start"
              >
                <span className="w-1 h-1 rounded-full bg-primary" />
                Forgot Password?
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground">Secure Connection</span>
              </div>
            </div>
            
            <LoadingButton isLoading={isLoading} />

            <GoogleOAuthButton disabled={isSubmitDisabled} />
            
            <div className="text-center">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href={ROUTES.REGISTER}
                  className="text-primary hover:text-primary-light font-semibold transition-colors group"
                >
                  Create Account
                  <span className="block h-px w-0 group-hover:w-full bg-primary transition-all duration-300 mx-auto" />
                </Link>
              </p>
            </div>
          </form>
          
          <FeaturesGrid />
        </div>
      </div>
    </FormProvider>
  );
};