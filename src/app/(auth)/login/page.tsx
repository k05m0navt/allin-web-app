// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message || "Login failed");
        return;
      }

      if (data?.user) {
        toast.success("Login successful");
        setRedirecting(true);
        window.location.href = "/admin";
      }
    } catch (error) {
      console.error("Unexpected login error:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors">
      <div className="max-w-md w-full space-y-8 p-10 bg-card shadow-lg rounded-xl animate-fade-in transition-colors">
        <h2 className="text-center text-3xl font-extrabold text-foreground">
          Admin Login
        </h2>
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={redirecting}>
            {redirecting ? (
              <div className="flex items-center justify-center gap-2">
                <Skeleton className="h-5 w-24 rounded" />
              </div>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
