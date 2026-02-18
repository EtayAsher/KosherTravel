"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  return (
    <main className="mx-auto max-w-md px-4 py-24">
      <div className="glass rounded-3xl p-6">
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <div className="mt-4 space-y-3">
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button
            className="w-full"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) return toast.error(error.message);
              router.push("/admin");
            }}
          >
            Sign in
          </Button>
        </div>
      </div>
    </main>
  );
}
