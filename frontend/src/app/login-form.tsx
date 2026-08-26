"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  isSupabaseConfigured: boolean;
};

type AuthMode = "sign-in" | "sign-up";

export function LoginForm({ isSupabaseConfigured }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNextPath = searchParams.get("next");
  const nextPath =
    requestedNextPath?.startsWith("/") && !requestedNextPath.startsWith("//")
      ? requestedNextPath
      : "/dashboard";
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(
    isSupabaseConfigured
      ? "등록된 계정으로 로그인하거나 새 계정을 만들 수 있습니다."
      : "Supabase 프로젝트 URL과 Publishable Key 설정이 필요합니다.",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setMessage("먼저 .env.local에 Supabase 연결 값을 설정해주세요.");
      return;
    }

    setIsLoading(true);
    setMessage(
      authMode === "sign-in"
        ? "로그인 확인 중입니다."
        : "계정을 생성하는 중입니다.",
    );

    const supabase = createClient();
    const { data, error } =
      authMode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (authMode === "sign-up" && !data.session) {
      setMessage(
        "계정은 생성됐지만 바로 로그인되지 않았습니다. Supabase의 이메일 확인 설정을 꺼야 즉시 로그인됩니다.",
      );
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  function selectMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setMessage(
      nextMode === "sign-in"
        ? "등록된 계정으로 로그인합니다."
        : "이메일 인증 메일 없이 계정을 생성합니다.",
    );
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--app-bg)] p-1">
        <button
          className={`rounded-md px-3 py-2 text-sm font-bold ${
            authMode === "sign-in"
              ? "bg-white text-[var(--app-fg)] shadow-sm"
              : "text-[var(--muted)]"
          }`}
          onClick={() => selectMode("sign-in")}
          type="button"
        >
          로그인
        </button>
        <button
          className={`rounded-md px-3 py-2 text-sm font-bold ${
            authMode === "sign-up"
              ? "bg-white text-[var(--app-fg)] shadow-sm"
              : "text-[var(--muted)]"
          }`}
          onClick={() => selectMode("sign-up")}
          type="button"
        >
          회원가입
        </button>
      </div>

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
        {isLoading
          ? authMode === "sign-in"
            ? "로그인 중"
            : "가입 중"
          : authMode === "sign-in"
            ? "로그인"
            : "회원가입"}
      </button>

      <p className="min-h-5 text-center text-xs leading-5 text-[var(--muted)]">
        {message}
      </p>
    </form>
  );
}
