import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/app/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const loginStats = [
  { label: "입력 방식", value: "직접·이미지" },
  { label: "인증 기준", value: "Supabase" },
  { label: "AI 풀이", value: "Gemini" },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8">
        <section className="flex flex-col justify-between gap-10 border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8 lg:min-h-[640px]">
          <div>
            <p className="text-sm font-bold text-[var(--accent)]">Together</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              틀린 문제를 모으고, 왜 틀렸는지 바로 복습합니다.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">
              오답 이미지와 정답을 넣으면 풀이를 정리하고, 오답 유형과 취약
              단원을 사용자별 기록으로 관리합니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {loginStats.map((item) => (
              <article
                className="border border-[var(--line)] bg-[var(--app-bg)] p-4"
                key={item.label}
              >
                <p className="text-sm font-semibold text-[var(--muted)]">
                  {item.label}
                </p>
                <strong className="mt-2 block text-2xl">{item.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-2xl font-bold">로그인</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              실제 분석, 저장, 복습 상태 변경은 로그인 후 대시보드에서 사용할 수
              있습니다.
            </p>
          </div>

          <Suspense
            fallback={
              <p className="mt-6 text-sm text-[var(--muted)]">
                로그인 폼을 준비하는 중입니다.
              </p>
            }
          >
            <LoginForm isSupabaseConfigured={isSupabaseConfigured} />
          </Suspense>

          <div className="mt-6 grid gap-3">
            <Link
              className="rounded-lg border border-[var(--line)] px-4 py-3 text-center text-sm font-bold transition hover:bg-[var(--app-bg)]"
              href="/preview"
            >
              기능 미리보기
            </Link>
            <p className="text-center text-xs leading-5 text-[var(--muted)]">
              미리보기에서는 기능 구성만 확인할 수 있고, 실제 입력과 저장은
              로그인 후 활성화됩니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
