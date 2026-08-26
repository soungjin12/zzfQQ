import Link from "next/link";

const previewItems = [
  {
    title: "오답 입력",
    description:
      "문제 내용, 내가 쓴 답, 정답, 풀이를 한 곳에 정리합니다. 이미지 첨부도 지원합니다.",
  },
  {
    title: "AI 풀이 생성",
    description:
      "문제 이미지를 바탕으로 정답과 풀이를 작성합니다.",
  },
  {
    title: "오답 유형 분류",
    description:
      "개념 혼동, 계산 실수, 조건 누락, 문제 해석 오류 같은 패턴을 분류합니다.",
  },
  {
    title: "복습 기록",
    description:
      "최근 분석 기록, 취약 단원, 복습 상태를 사용자별 DB 기록으로 관리합니다.",
  },
];

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[var(--line)] bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--accent)]">Together</p>
            <h1 className="mt-2 text-2xl font-bold">기능 미리보기</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              이 화면은 로그인 전에 어떤 기능이 있는지만 보여줍니다. 실제 입력,
              분석, 기록 저장은 로그인 후 대시보드에서 사용할 수 있습니다.
            </p>
          </div>
          <Link
            className="rounded-lg bg-[var(--accent)] px-4 py-3 text-center text-sm font-bold text-white"
            href="/"
          >
            로그인하기
          </Link>
        </header>

        <section className="grid flex-1 content-start gap-4 py-5 sm:grid-cols-2">
          {previewItems.map((item) => (
            <article
              className="border border-[var(--line)] bg-white p-5 shadow-sm"
              key={item.title}
            >
              <h2 className="text-lg font-bold">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {item.description}
              </p>
              <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-2 text-xs font-bold text-[var(--muted)]">
                로그인 후 사용 가능
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
