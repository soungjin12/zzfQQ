import { NextResponse } from "next/server";
import { makeMathReadable } from "@/lib/analysis/readable-math";
import { createClient } from "@/lib/supabase/server";

type SolveProblemRequest = {
  correctAnswer?: string;
  imageDataUrl?: string;
  problemStatement?: string;
  subject?: string;
  unit?: string;
  wrongAnswer?: string;
};

type GeminiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    status?: string;
  };
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
};

type GeminiResponse = {
  output_text?: string;
  steps?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
    type?: string;
  }>;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type SolvedProblemResult = {
  answer: string;
  problemStatement: string;
  questionTitle: string;
  solution: string;
  subject: string;
  unit: string;
};

const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

function parseImageDataUrl(value: string) {
  const match = value.match(
    /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i,
  );

  if (!match) {
    return null;
  }

  return {
    data: match[2],
    mimeType: match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1],
  };
}

function getOutputText(value: unknown) {
  const response = value as GeminiResponse;
  const outputText = response.output_text?.trim();

  if (outputText) {
    return outputText;
  }

  const stepTexts =
    response.steps?.flatMap(
      (step) =>
        step.content
          ?.map((part) => part.text?.trim() ?? "")
          .filter(Boolean) ?? [],
    ) ?? [];

  if (stepTexts.length > 0) {
    return stepTexts.join("\n").trim();
  }

  const texts =
    response.candidates?.flatMap(
      (candidate) =>
        candidate.content?.parts
          ?.map((part) => part.text?.trim() ?? "")
          .filter(Boolean) ?? [],
    ) ?? [];

  return texts.join("\n").trim();
}

function getGeminiErrorMessage(value: unknown) {
  const response = value as GeminiErrorResponse | null;
  const error = response?.error;
  const errors = response?.errors ?? [];

  if (!error) {
    return errors
      .map((item) => [item.message, item.code].filter(Boolean).join(" / "))
      .filter(Boolean)
      .join(" | ");
  }

  return [error.message, error.status, error.code].filter(Boolean).join(" / ");
}

function stripMarkdownJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseSolvedProblemResult(value: string): SolvedProblemResult {
  const trimmedValue = stripMarkdownJsonFence(value);
  const jsonStart = trimmedValue.indexOf("{");
  const jsonEnd = trimmedValue.lastIndexOf("}");
  const jsonCandidate =
    jsonStart >= 0 && jsonEnd > jsonStart
      ? trimmedValue.slice(jsonStart, jsonEnd + 1)
      : trimmedValue;

  try {
    const parsed = JSON.parse(jsonCandidate) as Partial<SolvedProblemResult>;
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    const problemStatement =
      typeof parsed.problemStatement === "string"
        ? parsed.problemStatement.trim()
        : "";
    const questionTitle =
      typeof parsed.questionTitle === "string" ? parsed.questionTitle.trim() : "";
    const solution =
      typeof parsed.solution === "string" ? parsed.solution.trim() : "";
    const subject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
    const unit = typeof parsed.unit === "string" ? parsed.unit.trim() : "";

    if (answer || solution || problemStatement || questionTitle || subject || unit) {
      return {
        answer,
        problemStatement,
        questionTitle,
        solution: solution || trimmedValue,
        subject,
        unit,
      };
    }
  } catch {
    // Gemini occasionally returns plain text despite being asked for JSON.
  }

  const answerMatch = trimmedValue.match(/(?:정답|답)\s*[:：]\s*([^\n]+)/);

  return {
    answer: answerMatch?.[1]?.trim() ?? "",
    problemStatement: "",
    questionTitle: "",
    solution: trimmedValue,
    subject: "",
    unit: "",
  };
}

function normalizeSolvedProblemResult(
  result: SolvedProblemResult,
): SolvedProblemResult {
  return {
    ...result,
    answer: makeMathReadable(result.answer),
    problemStatement: makeMathReadable(result.problemStatement),
    questionTitle: makeMathReadable(result.questionTitle),
    solution: makeMathReadable(result.solution),
    unit: makeMathReadable(result.unit),
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const claimsResult = await supabase?.auth.getClaims();

  if (!claimsResult?.data?.claims || claimsResult.error) {
    return NextResponse.json(
      { error: "로그인 후 사용할 수 있습니다." },
      { status: 401 },
    );
  }

  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "서버에 GEMINI_API_KEY가 설정되어 있지 않습니다." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as SolveProblemRequest;
  const imageDataUrl = body.imageDataUrl?.trim() ?? "";
  const imageData = imageDataUrl ? parseImageDataUrl(imageDataUrl) : null;
  const correctAnswer = body.correctAnswer?.trim() ?? "";
  const problemStatement = body.problemStatement?.trim() ?? "";

  if (imageDataUrl && !imageData) {
    return NextResponse.json(
      { error: "PNG, JPG, WebP 문제 이미지만 첨부할 수 있습니다." },
      { status: 400 },
    );
  }

  if (!imageData && !problemStatement) {
    return NextResponse.json(
      { error: "문제 내용 또는 문제 이미지를 입력해주세요." },
      { status: 400 },
    );
  }

  const interactionModel = geminiModel.replace(/^models\//, "");
  const promptText = [
    "너는 한국어로 설명하는 수학/학습 튜터다.",
    imageData
      ? "문제 이미지와 사용자가 입력한 텍스트를 함께 보고 정답과 풀이를 작성한다."
      : "사용자가 직접 입력한 문제 내용을 보고 정답과 풀이를 작성한다.",
    "사용자가 정답을 입력했다면 그 정답이 왜 맞는지 검증하면서 풀이한다.",
    "사용자가 정답을 입력하지 않았다면 문제를 직접 풀어서 가장 타당한 정답을 제시한다.",
    imageData
      ? "이미지나 텍스트에서 문제를 읽을 수 없거나 조건이 부족하면 추측하지 말고 answer는 빈 문자열로 두고 solution에 부족한 정보를 설명한다."
      : "텍스트만으로 조건이 부족하면 추측하지 말고 answer는 빈 문자열로 두고 solution에 부족한 정보를 설명한다.",
    "반드시 JSON만 반환한다. 마크다운 코드블록은 쓰지 않는다.",
    "풀이에는 LaTeX 문법을 쓰지 않는다. $$, \\(...\\), \\begin{pmatrix}, \\cdot, &, \\\\ 같은 표현을 금지한다.",
    "행렬은 '1행 1열 = ...', '1행 2열 = ...'처럼 위치별 한국어 문장으로 설명한다.",
    "수식이 필요하면 일반 텍스트 기호만 쓴다. 예: ×, ÷, /, =, 괄호.",
    '형식: {"subject":"과목","unit":"단원","questionTitle":"문제 제목","problemStatement":"문제 내용","answer":"최종 정답","solution":"학생이 이해할 수 있는 자세한 풀이"}',
    "",
    `과목: ${body.subject?.trim() || "미입력"}`,
    `단원: ${body.unit?.trim() || "미입력"}`,
    `사용자가 적은 문제 내용: ${
      problemStatement || (imageData ? "이미지 기준으로 문제를 읽어주세요." : "미입력")
    }`,
    `사용자가 쓴 답 또는 풀이: ${body.wrongAnswer?.trim() || "미입력"}`,
    `사용자가 알고 있는 정답: ${correctAnswer || "미입력"}`,
    "",
    "요청:",
    imageData
      ? "1. 이미지 속 문제를 먼저 읽고, 주어진 조건을 정리하세요."
      : "1. 입력된 문제의 조건을 먼저 정리하세요.",
    "2. 과목, 단원, 문제 제목, 문제 내용을 추론해 각각 subject, unit, questionTitle, problemStatement에 넣으세요.",
    "3. 정답이 미입력이면 직접 풀어서 최종 정답을 answer에 넣으세요.",
    "4. 정답이 입력되어 있으면 그 정답이 맞는 이유를 설명하고, 틀린 정답으로 보이면 solution에 그 점을 분명히 쓰세요.",
    "5. 계산 과정이나 논리를 단계별로 설명하세요.",
    "6. 사용자의 답이 있다면 정답 풀이와 처음 달라지는 지점을 짚어주세요.",
    "7. 모르면 추측하지 말고 어떤 정보가 부족한지 말하세요.",
    "8. 수식 덩어리만 쓰지 말고 일반 학생이 읽을 수 있는 말로 풀이하세요.",
    "9. 학생이 바로 복습할 수 있도록 한국어로 자세하지만 군더더기 없이 작성하세요.",
  ].join("\n");
  const input = [
    ...(imageData
      ? [
          {
            type: "image",
            data: imageData.data,
            mime_type: imageData.mimeType,
          },
        ]
      : []),
    {
      type: "text",
      text: promptText,
    },
  ];

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Api-Revision": "2026-05-20",
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        input,
        model: interactionModel,
        store: false,
      }),
    },
  );

  const result = (await response.json()) as unknown;

  if (!response.ok) {
    const detailMessage = getGeminiErrorMessage(result);
    const rateLimitMessage =
      response.status === 429
        ? "Gemini 사용량 한도, 결제 상태, 또는 요청 제한 때문에 풀이를 생성하지 못했습니다."
        : "AI 풀이 생성에 실패했습니다.";

    return NextResponse.json(
      {
        detail: detailMessage,
        error: detailMessage
          ? `${rateLimitMessage} (${detailMessage})`
          : rateLimitMessage,
      },
      { status: response.status },
    );
  }

  const solvedResult = normalizeSolvedProblemResult(
    parseSolvedProblemResult(getOutputText(result)),
  );

  if (!solvedResult.solution) {
    return NextResponse.json(
      { error: "Gemini가 풀이 텍스트를 반환하지 않았습니다." },
      { status: 502 },
    );
  }

  return NextResponse.json(solvedResult);
}
