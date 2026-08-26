import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/app/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const loginStats = [
  { label: "문제 입력", value: "직접·이미지" },
  { label: "자동 분석", value: "정답·풀이" },
  { label: "기록 저장", value: "내 계정" },
];

const previewItems = [
  { label: "오답 유형", value: "계산 실수" },
  { label: "취약 단원", value: "분수의 나눗셈" },
  { label: "복습 상태", value: "복습 대기" },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8">
        <section className="flex flex-col justify-between gap-8 border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8 lg:min-h-[640px]">
          <div>
            <p className="text-sm font-bold text-[var(--accent)]">Together</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              틀린 문제를 넣으면 정답과 풀이부터 정리합니다.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">
              문제 사진을 첨부하면 AI가 문제를 읽고 정답, 풀이, 오답 패턴을
              정리합니다. 기록은 계정별로 저장됩니다.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {loginStats.map((item) => (
                <article
                  className="border border-[var(--line)] bg-[var(--app-bg)] p-4"
                  key={item.label}
                >
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    {item.label}
                  </p>
                  <strong className="mt-2 block text-xl">{item.value}</strong>
                </article>
              ))}
            </div>

            <div className="border border-[var(--line)] bg-[var(--app-bg)] p-4">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                <strong>분석 미리보기</strong>
                <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-[var(--accent)] ring-1 ring-[var(--line)]">
                  이미지 분석
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {previewItems.map((item) => (
                  <div className="bg-white p-3 ring-1 ring-[var(--line)]" key={item.label}>
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-2xl font-bold">로그인</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              분석과 저장은 로그인 후 사용할 수 있습니다.
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
          </div>
        </section>
      </div>
    </main>
  );
}
