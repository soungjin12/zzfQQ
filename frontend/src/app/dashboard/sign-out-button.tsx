"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  return (
    <button
      className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--app-bg)] hover:text-[var(--app-fg)] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isLoading}
      onClick={handleSignOut}
      type="button"
    >
      {isLoading ? "로그아웃 중" : "로그아웃"}
    </button>
  );
}
