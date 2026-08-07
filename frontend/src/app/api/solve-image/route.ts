import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SolveImageRequest = {
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
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
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
  const error = (value as GeminiErrorResponse | null)?.error;

  if (!error) {
    return "";
  }

  return [error.message, error.status, error.code].filter(Boolean).join(" / ");
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

  const body = (await request.json()) as SolveImageRequest;
  const imageDataUrl = body.imageDataUrl?.trim() ?? "";
  const imageData = parseImageDataUrl(imageDataUrl);
  const correctAnswer = body.correctAnswer?.trim() ?? "";

  if (!imageData) {
    return NextResponse.json(
      { error: "PNG, JPG, WebP 문제 이미지를 먼저 첨부해주세요." },
      { status: 400 },
    );
  }

  if (!correctAnswer) {
    return NextResponse.json(
      { error: "정답을 먼저 입력해야 풀이를 생성할 수 있습니다." },
      { status: 400 },
    );
  }

  const modelPath = geminiModel.startsWith("models/")
    ? geminiModel
    : `models/${geminiModel}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(
      geminiApiKey,
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                inline_data: {
                  data: imageData.data,
                  mime_type: imageData.mimeType,
                },
              },
              {
                text: [
                  `과목: ${body.subject?.trim() || "미입력"}`,
                  `단원: ${body.unit?.trim() || "미입력"}`,
                  `사용자가 적은 문제 내용: ${
                    body.problemStatement?.trim() ||
                    "이미지 기준으로 문제를 읽어주세요."
                  }`,
                  `사용자가 쓴 답 또는 풀이: ${body.wrongAnswer?.trim() || "미입력"}`,
                  `문제의 정답: ${correctAnswer}`,
                  "",
                  "요청:",
                  "1. 이미지 속 문제를 먼저 읽고, 주어진 조건을 정리하세요.",
                  "2. 정답이 왜 그 값인지 계산 과정이나 논리를 단계별로 설명하세요.",
                  "3. 사용자의 답이 있다면 정답 풀이와 처음 달라지는 지점을 짚어주세요.",
                  "4. 모르면 추측하지 말고 어떤 정보가 부족한지 말하세요.",
                  "5. 학생이 바로 복습할 수 있도록 한국어로 자세하지만 군더더기 없이 작성하세요.",
                ].join("\n"),
              },
            ],
          },
        ],
        system_instruction: {
          parts: [
            {
              text:
                "너는 한국어로 설명하는 수학/학습 튜터다. 문제 이미지와 사용자가 입력한 정답을 보고, 왜 그 정답이 맞는지 풀이를 설명한다. 이미지에서 문제를 읽을 수 없거나 정답이 이미지 내용과 맞는지 판단하기 어렵다면 추측하지 말고 부족한 정보를 명확히 말한다.",
            },
          ],
        },
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

  const solution = getOutputText(result);

  if (!solution) {
    return NextResponse.json(
      { error: "Gemini가 풀이 텍스트를 반환하지 않았습니다." },
      { status: 502 },
    );
  }

  return NextResponse.json({ solution });
}
