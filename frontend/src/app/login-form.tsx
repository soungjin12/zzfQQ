"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  isSupabaseConfigured: boolean;
};

export function LoginForm({ isSupabaseConfigured }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNextPath = searchParams.get("next");
  const nextPath =
    requestedNextPath?.startsWith("/") && !requestedNextPath.startsWith("//")
      ? requestedNextPath
      : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(
    isSupabaseConfigured
      ? "등록된 계정으로 로그인하면 대시보드 기능을 사용할 수 있습니다."
      : "Supabase 프로젝트 URL과 Publishable Key 설정이 필요합니다.",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setMessage("먼저 .env.local에 Supabase 연결 값을 설정해주세요.");
      return;
    }

    setIsLoading(true);
    setMessage("로그인 확인 중입니다.");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold">
        이메일
        <input
          className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="team@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        비밀번호
        <input
          className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호 입력"
          minLength={6}
          required
          type="password"
          value={password}
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
        <input className="h-4 w-4 accent-[var(--accent)]" type="checkbox" />
        로그인 유지
      </label>

      <button
        className={`mt-2 rounded-lg px-4 py-3 text-sm font-bold text-white ${
          isSupabaseConfigured
            ? "bg-[var(--accent)] hover:bg-[#0c7779]"
            : "bg-[var(--disabled)]"
        }`}
        disabled={!isSupabaseConfigured || isLoading}
        type="submit"
      >
        {isLoading ? "로그인 중" : "로그인"}
      </button>

      <p className="min-h-5 text-center text-xs leading-5 text-[var(--muted)]">
        {message}
      </p>
    </form>
  );
}
