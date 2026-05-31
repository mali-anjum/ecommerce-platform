"use client";

import { ElementType, InputHTMLAttributes, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface InputFieldProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: ElementType;
  error?: { message?: string } | any;
}

export const InputField = ({
  label,
  icon: Icon,
  error,
  type = "text",
  name,
  className,
  ...rest
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={name}
        className="text-sm font-medium flex items-center gap-2"
      >
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </Label>

      <div className="relative group">
        <Input
          id={name}
          name={name}
          type={inputType}
          className={`
            pl-10 pr-10
            bg-card/50 backdrop-blur-sm
            border-glass-border
            focus:border-primary
            focus:ring-1 focus:ring-primary/50
            text-foreground
            placeholder:text-muted-foreground/60
            transition-all duration-300
            w-full
            ${
              error
                ? "border-destructive/50 focus:border-destructive focus:ring-destructive/50"
                : ""
            }
            group-hover:border-primary/50
            ${className ?? ""}
          `}
          {...rest}
        />

        {/* Left Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2
              text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {error?.message && (
        <p className="text-destructive text-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
          {error.message}
        </p>
      )}
    </div>
  );
};
