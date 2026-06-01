"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/hooks/use-toast";

export function LoginOAuthAlert() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const oauthError = searchParams.get("oauth_error");
    if (!oauthError) return;

    toast({
      title: "Social sign-in failed",
      description: decodeURIComponent(oauthError),
      variant: "destructive",
    });
    router.replace("/auth/login");
  }, [searchParams, toast, router]);

  return null;
}
