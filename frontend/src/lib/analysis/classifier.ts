import type { AnalysisDraft } from "@/lib/analysis/types";

const patternRules = [
  {
    pattern: "개념 혼동",
    keywords: ["개념", "공식", "정의", "원리", "분수", "함수", "역수"],
    reviewDirection:
      "풀이를 다시 시작하기 전에 필요한 개념과 조건을 한 문장으로 설명하고, 비슷한 유형 2~3개를 이어서 풀어보세요.",
    mistakeReason:
      "계산력보다 어떤 개념을 적용해야 하는지 판단하는 출발점에서 흔들렸을 가능성이 큽니다.",
    detailedExplanation:
      "이 유형은 풀이 방법을 외웠지만 왜 그 방법을 써야 하는지 연결이 약할 때 자주 발생합니다. 문제에서 요구하는 개념을 먼저 확인하고, 그 개념이 적용되는 조건을 말로 설명한 뒤 계산으로 넘어가야 합니다.",
    correctSolution:
      "문제의 조건을 읽고 필요한 개념을 먼저 고릅니다. 그 개념의 정의나 공식을 한 줄로 적은 뒤, 각 계산 단계가 그 개념과 어떻게 연결되는지 확인하면서 풀이를 진행합니다.",
    reviewTopics: ["핵심 개념 정의", "공식을 사용하는 이유", "유사 개념 비교"],
    solutionSteps: [
      "문제에서 요구하는 값을 먼저 확인합니다.",
      "사용해야 할 개념이나 공식을 한 줄로 적습니다.",
      "정답 풀이와 내가 쓴 풀이가 처음 달라진 지점을 비교합니다.",
    ],
    solutionStrategy:
      "계산부터 시작하지 말고, 개념 적용 조건을 먼저 말로 확인한 뒤 풀이를 시작하세요.",
  },
  {
    pattern: "계산 실수",
    keywords: ["계산", "부호", "약분", "통분", "전개", "분배", "이항"],
    reviewDirection:
      "마지막 답만 보지 말고 부호, 연산 순서, 약분 여부를 체크리스트로 검산하세요.",
    mistakeReason:
      "풀이 방향은 맞았지만 중간 계산을 확인하지 않아 작은 실수가 전체 답을 바꿨을 가능성이 있습니다.",
    detailedExplanation:
      "계산 실수는 대체로 풀이 방식 자체보다 중간식 관리에서 발생합니다. 한 줄에 너무 많은 연산을 몰아 쓰면 실수 지점을 찾기 어려우니, 식을 줄 단위로 분리하고 바뀐 부분만 확인하는 습관이 필요합니다.",
    correctSolution:
      "식을 한 줄씩 정리하고, 각 줄에서 바뀐 부분만 확인합니다. 마지막 답을 원래 문제에 다시 넣어 성립하는지 검산합니다.",
    reviewTopics: ["연산 순서", "부호 처리", "검산"],
    solutionSteps: [
      "식을 한 줄씩 분리해서 전개합니다.",
      "부호와 연산 기호가 바뀌는 지점을 표시합니다.",
      "마지막 답을 원래 식에 대입해 검산합니다.",
    ],
    solutionStrategy:
      "빠르게 암산하기보다 중간식을 남기고 검산 가능한 형태로 풀이하세요.",
  },
  {
    pattern: "조건 누락",
    keywords: ["조건", "범위", "이상", "이하", "그래프", "단서", "제한"],
    reviewDirection:
      "문제의 조건을 먼저 목록으로 만들고, 풀이 단계마다 어떤 조건을 사용했는지 표시하세요.",
    mistakeReason:
      "문제에 주어진 조건 중 일부를 사용하지 않아 답이 조건과 맞지 않았을 가능성이 있습니다.",
    detailedExplanation:
      "조건 누락은 풀이 능력보다 문제를 정리하는 순서에서 자주 발생합니다. 바로 계산하지 말고, 조건과 제한 범위를 따로 적어두면 답을 구한 뒤 빠뜨린 조건이 없는지 확인하기 쉽습니다.",
    correctSolution:
      "주어진 조건을 모두 적고, 풀이 과정에서 사용한 조건을 하나씩 체크합니다. 마지막에는 답이 모든 조건을 만족하는지 다시 확인합니다.",
    reviewTopics: ["조건 표시", "범위 제한", "문장 해석"],
    solutionSteps: [
      "문제의 조건과 제한 범위를 표시합니다.",
      "각 조건이 풀이에서 어디에 쓰이는지 적습니다.",
      "답을 구한 뒤 모든 조건을 만족하는지 검토합니다.",
    ],
    solutionStrategy:
      "조건을 목록으로 바꾸고, 하나씩 지워가며 적용하는 방식으로 풀어보세요.",
  },
  {
    pattern: "문제 해석 오류",
    keywords: ["해석", "구하", "비교", "무엇", "문장", "자료", "그래프"],
    reviewDirection:
      "구해야 하는 값과 주어진 정보를 분리해서 적고, 풀이 전에 문제를 한 문장으로 다시 요약하세요.",
    mistakeReason:
      "계산 전 단계에서 문제의 요구 사항을 다르게 이해해 풀이 목표가 어긋났을 가능성이 있습니다.",
    detailedExplanation:
      "문제 해석 오류는 계산을 잘해도 처음 잡은 목표가 다르면 정답에 도달하기 어렵습니다. 구해야 하는 값, 주어진 값, 비교해야 하는 대상을 나눠 적으면 문제의 의도를 놓칠 가능성이 줄어듭니다.",
    correctSolution:
      "문제를 한 문장으로 다시 말하고, 구해야 하는 값을 먼저 적습니다. 그 다음 주어진 정보를 표처럼 정리한 뒤 질문에 직접 답하는 형태인지 확인합니다.",
    reviewTopics: ["문제 재진술", "구해야 할 값", "자료 해석"],
    solutionSteps: [
      "문제를 자기 말로 한 문장 요약합니다.",
      "구해야 하는 값과 주어진 값을 따로 적습니다.",
      "풀이가 질문에 직접 답하는지 마지막에 확인합니다.",
    ],
    solutionStrategy:
      "계산보다 먼저 질문 의도를 확인하고, 답의 형태를 예상한 뒤 풀이하세요.",
  },
];

type SolvedProblem = {
  answer: string;
  explanation: string;
  steps: string[];
  strategy: string;
  reviewTopics: string[];
};

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }

  return a || 1;
}

function simplifyFraction(numerator: number, denominator: number) {
  const sign = denominator < 0 ? -1 : 1;
  const normalizedNumerator = numerator * sign;
  const normalizedDenominator = denominator * sign;
  const divisor = gcd(normalizedNumerator, normalizedDenominator);

  return {
    numerator: normalizedNumerator / divisor,
    denominator: normalizedDenominator / divisor,
  };
}

function formatFraction(numerator: number, denominator: number) {
  return denominator === 1 ? `${numerator}` : `${numerator}/${denominator}`;
}

function parseSignedNumber(value: string) {
  const normalized = value.replace(/\s+/g, "");

  if (normalized === "" || normalized === "+") {
    return 1;
  }

  if (normalized === "-") {
    return -1;
  }

  return Number(normalized);
}

function buildFractionDivisionSolution(problemStatement: string): SolvedProblem | null {
  const match = problemStatement.match(
    /(-?\d+)\s*\/\s*(-?\d+)\s*(?:÷|나누기|\/)\s*(-?\d+)\s*\/\s*(-?\d+)/,
  );

  if (!match) {
    return null;
  }

  const [, firstNumerator, firstDenominator, secondNumerator, secondDenominator] =
    match.map(Number);

  if (
    firstDenominator === 0 ||
    secondNumerator === 0 ||
    secondDenominator === 0
  ) {
    return null;
  }

  const multipliedNumerator = firstNumerator * secondDenominator;
  const multipliedDenominator = firstDenominator * secondNumerator;
  const simplified = simplifyFraction(multipliedNumerator, multipliedDenominator);
  const answer = formatFraction(simplified.numerator, simplified.denominator);
  const originalLeft = formatFraction(firstNumerator, firstDenominator);
  const originalRight = formatFraction(secondNumerator, secondDenominator);
  const reciprocal = formatFraction(secondDenominator, secondNumerator);
  const multiplied = formatFraction(multipliedNumerator, multipliedDenominator);

  return {
    answer,
    explanation: [
      `${originalLeft}를 ${originalRight}로 나눈다는 것은 ${originalRight}가 ${originalLeft} 안에 몇 번 들어가는지 구하는 것입니다.`,
      `분수 나눗셈은 나누는 수를 역수로 바꾼 뒤 곱합니다. 따라서 ${originalLeft} ÷ ${originalRight} = ${originalLeft} × ${reciprocal}입니다.`,
      `분자는 분자끼리, 분모는 분모끼리 곱하면 ${multiplied}이고, 이를 약분하면 ${answer}입니다.`,
      `따라서 이 문제의 정답은 ${answer}입니다.`,
    ].join("\n"),
    steps: [
      `${originalRight}의 역수를 ${reciprocal}로 바꿉니다.`,
      `${originalLeft} × ${reciprocal}로 식을 다시 씁니다.`,
      `분자끼리 곱해 ${multipliedNumerator}, 분모끼리 곱해 ${multipliedDenominator}를 얻습니다.`,
      `${multiplied}를 약분해 ${answer}를 얻습니다.`,
    ],
    strategy:
      "분수 나눗셈에서는 두 번째 분수를 역수로 바꾼 뒤 곱셈으로 계산합니다.",
    reviewTopics: ["역수", "분수 나눗셈", "약분"],
  };
}

function buildLinearEquationSolution(problemStatement: string): SolvedProblem | null {
  const match = problemStatement
    .replace(/\s+/g, "")
    .match(/^([+-]?\d*)x([+-]\d+)?=([+-]?\d*)x([+-]\d+)?/);

  if (!match) {
    return null;
  }

  const leftCoefficient = parseSignedNumber(match[1]);
  const leftConstant = Number(match[2] ?? 0);
  const rightCoefficient = parseSignedNumber(match[3]);
  const rightConstant = Number(match[4] ?? 0);
  const coefficient = leftCoefficient - rightCoefficient;
  const constant = rightConstant - leftConstant;

  if (coefficient === 0) {
    return null;
  }

  const solution = simplifyFraction(constant, coefficient);
  const formattedSolution = formatFraction(solution.numerator, solution.denominator);
  const answer = `x = ${formattedSolution}`;

  return {
    answer,
    explanation: [
      "일차방정식은 x가 있는 항과 숫자만 있는 항을 서로 다른 쪽으로 모아 풉니다.",
      `왼쪽의 x항 ${leftCoefficient}x에서 오른쪽의 x항 ${rightCoefficient}x를 빼면 ${coefficient}x가 남습니다.`,
      `오른쪽 상수 ${rightConstant}에서 왼쪽 상수 ${leftConstant}를 빼면 ${constant}가 남습니다.`,
      `따라서 ${coefficient}x = ${constant}이고, 양변을 ${coefficient}로 나누면 ${answer}입니다.`,
    ].join("\n"),
    steps: [
      "x가 있는 항은 왼쪽으로 모읍니다.",
      "숫자만 있는 항은 오른쪽으로 모읍니다.",
      `${coefficient}x = ${constant}로 정리합니다.`,
      `양변을 ${coefficient}로 나누어 ${answer}를 얻습니다.`,
    ],
    strategy:
      "이항할 때 부호가 바뀌는 지점을 표시하고, 마지막에 원래 식에 대입해 검산합니다.",
    reviewTopics: ["이항", "부호 변화", "일차방정식 검산"],
  };
}

function buildProblemSolution(
  draft: AnalysisDraft,
  solvedProblem: SolvedProblem | null,
) {
  const problemStatement = draft.problem_statement.trim();
  const targetAnswer = draft.correct_answer.trim();
  const providedSolution = draft.provided_solution.trim();
  const wrongAnswer = draft.wrong_answer.trim();

  if (providedSolution) {
    return [
      problemStatement ? `문제: ${problemStatement}` : "",
      targetAnswer ? `정답: ${targetAnswer}` : "",
      `풀이:\n${providedSolution}`,
      wrongAnswer
        ? `내 풀이와 비교: 내가 쓴 답 "${wrongAnswer}"와 정답 풀이가 처음 달라지는 지점을 확인하세요.`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (!solvedProblem) {
    return [
      problemStatement ? `문제: ${problemStatement}` : "",
      targetAnswer ? `입력한 정답: ${targetAnswer}` : "",
      "현재 로컬 분류기는 이 문제의 정답이 왜 그렇게 나오는지 정확한 계산 풀이를 자동으로 만들 수 없습니다.",
      "정확한 풀이가 필요하면 문제 이미지를 첨부하고 정답을 입력한 뒤 AI 풀이 생성을 사용하세요.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    problemStatement ? `문제: ${problemStatement}` : "",
    `정답: ${targetAnswer || solvedProblem.answer}`,
    `풀이:\n${solvedProblem.explanation}`,
    wrongAnswer
      ? `내 풀이와 비교: 내가 쓴 답 "${wrongAnswer}"는 정답 풀이의 결론 "${solvedProblem.answer}"와 다릅니다. 보통 위 풀이 단계 중 처음으로 다른 식을 쓴 지점에서 오답이 발생합니다.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function classifyWrongAnswer(draft: AnalysisDraft) {
  const joinedText = [
    draft.subject,
    draft.unit,
    draft.question_title,
    draft.problem_statement,
    draft.wrong_answer,
    draft.correct_answer,
    draft.provided_solution,
    draft.explanation,
  ]
    .join(" ")
    .toLowerCase();

  const matchedRule =
    patternRules.find((rule) =>
      rule.keywords.some((keyword) => joinedText.includes(keyword)),
    ) ?? patternRules[0];

  const filledFields = Object.values(draft).filter(
    (value) => value.trim().length > 0,
  ).length;
  const confidence = Math.min(94, 62 + filledFields * 5);
  const providedSolution = draft.provided_solution.trim();
  const solvedProblem =
    buildFractionDivisionSolution(draft.problem_statement.trim()) ??
    buildLinearEquationSolution(draft.problem_statement.trim());
  const correctSolution = buildProblemSolution(draft, solvedProblem);
  const solutionSteps = providedSolution
    ? providedSolution
        .split(/\n+/)
        .map((step) => step.trim())
        .filter(Boolean)
    : (solvedProblem?.steps ?? []);
  const mistakeReason = providedSolution
    ? draft.explanation.trim() ||
      "입력한 정답 풀이와 내가 쓴 풀이가 처음 달라지는 지점을 확인해야 합니다."
    : solvedProblem
      ? draft.explanation.trim() || matchedRule.mistakeReason
      : "이 문항은 아직 정확한 풀이가 없어 오답 원인을 단정하기 어렵습니다.";
  const detailedExplanation = providedSolution
    ? [
        "사용자가 입력한 정답 풀이를 기준으로 문제 풀이를 표시합니다.",
        draft.wrong_answer.trim()
          ? "오답 분석은 내 풀이와 정답 풀이의 첫 차이를 찾는 방식으로 진행하세요."
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : solvedProblem
      ? [
          `정답이 ${draft.correct_answer.trim() || solvedProblem.answer}인 이유는 풀이 과정에서 최종값이 ${solvedProblem.answer}로 정리되기 때문입니다.`,
          draft.wrong_answer.trim()
            ? "내 풀이와 비교할 때는 결론보다 먼저 달라진 중간식을 찾아야 합니다."
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

  return {
    confidence: providedSolution || solvedProblem ? confidence : Math.min(confidence, 58),
    correct_solution: correctSolution,
    detailed_explanation: detailedExplanation,
    mistake_reason: mistakeReason,
    pattern: providedSolution || solvedProblem ? matchedRule.pattern : "정확한 풀이 필요",
    review_direction: providedSolution
      ? "입력한 정답 풀이와 내 풀이를 줄 단위로 비교해 처음 달라진 부분을 복습하세요."
      : solvedProblem
        ? "정답 풀이의 각 줄을 내 풀이와 비교해 처음 달라진 단계를 복습하세요."
        : "정확한 풀이 생성을 위해 AI 풀이 생성 또는 정답 풀이 입력이 필요합니다.",
    review_topics: providedSolution
      ? ["정답 풀이 비교", "오답 지점 찾기"]
      : solvedProblem
        ? solvedProblem.reviewTopics
        : ["AI 풀이 생성 필요"],
    solution_steps: solutionSteps,
    solution_strategy: providedSolution
      ? "정답 풀이의 순서를 기준으로 내 풀이를 한 줄씩 대조하세요."
      : (solvedProblem?.strategy ?? ""),
  };
}
