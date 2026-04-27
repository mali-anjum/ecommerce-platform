"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Lock, ArrowRight } from "lucide-react";

import { registerSchema, RegisterFormData } from "@/components/schemas/registerSchema";
import { useRegister } from "@/hooks/auth/useRegister";
import { InputField } from "./FormInput";
import { LoadingButton } from "./LoadingButton";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { BenefitsGrid } from "./BenefitsGrid";
import logo from "../../../public/images/logo.webp"

export const RegisterForm = () => {
  const { isLoading, onSubmit } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const password = watch("password");

  const handleFormSubmit = async (data: RegisterFormData) => {
    const result = await onSubmit(data);
    if (result?.error) {
      setError("email", {
        type: "manual",
        message: result.error,
      });
    }
  };

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12 relative min-h-screen lg:min-h-0">
      <div className="max-w-md w-full mx-auto">
        {/* Logo Section */}
        <div className="flex justify-center mb-8 group">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500" />
            <Image 
              src={logo} 
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

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            Create Account
          </h1>
          <p className="text-muted-foreground">
            Begin your journey into the future
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full mt-4" />
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <InputField
            label="Full Name"
            type="text"
            icon={User}
            placeholder="Enter your name"
            {...register("name")}
            error={errors.name}
            disabled={isLoading}
          />
          
          <InputField
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="Enter your email"
            {...register("email")}
            error={errors.email}
            disabled={isLoading}
          />
          
          <InputField
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Create a strong password"
            {...register("password")}
            error={errors.password}
            disabled={isLoading}
          />
          
          <PasswordStrengthIndicator password={password} />
          
          <InputField
            label="Confirm Password"
            type="password"
            icon={Lock}
            placeholder="Confirm your password"
            {...register("confirmPassword")}
            error={errors.confirmPassword}
            disabled={isLoading}
          />

          
          <LoadingButton isLoading={isLoading} variant="register" />
          
          <div className="text-center pt-4 border-t border-border/50">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary-light font-semibold transition-colors group inline-flex items-center gap-1"
              >
                Sign In
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </form>
          <BenefitsGrid />

        {/* Terms */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/60">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-primary/70 hover:text-primary transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary/70 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};