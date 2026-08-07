import type { AnalysisRecord } from "@/lib/analysis/types";

export const sampleAnalyses: AnalysisRecord[] = [
  {
    id: "sample-1",
    source_type: "direct",
    image_path: null,
    image_url: null,
    subject: "수학",
    unit: "분수의 나눗셈",
    question_title: "분수 나눗셈 계산",
    problem_statement: "3/4 ÷ 1/2의 값을 구하시오.",
    wrong_answer:
      "분자끼리, 분모끼리 바로 나누어 3/8이라고 계산했습니다.",
    correct_answer: "3/2",
    provided_solution:
      "3/4 ÷ 1/2는 나누는 분수 1/2를 역수 2/1로 바꾸어 계산합니다.\n3/4 × 2/1 = 6/4이고, 6/4를 약분하면 3/2입니다.",
    explanation: "분수 나눗셈을 역수의 곱셈으로 바꾸는 과정을 놓쳤습니다.",
    pattern: "개념 혼동",
    confidence: 91,
    correct_solution:
      "문제: 3/4 ÷ 1/2의 값을 구하시오.\n\n정답: 3/2\n\n풀이:\n3/4를 1/2로 나눈다는 것은 1/2가 3/4 안에 몇 번 들어가는지 구하는 것입니다.\n분수 나눗셈은 나누는 수를 역수로 바꾼 뒤 곱합니다. 따라서 3/4 ÷ 1/2 = 3/4 × 2/1입니다.\n분자는 분자끼리, 분모는 분모끼리 곱하면 6/4이고, 이를 약분하면 3/2입니다.\n따라서 이 문제의 정답은 3/2입니다.",
    detailed_explanation:
      "오답은 분수 나눗셈의 의미를 곱셈 변환과 연결하지 못해 생긴 것입니다. 분수 나눗셈은 바로 분자와 분모를 나누는 문제가 아니라, 나누는 수를 역수로 바꿔 곱하는 구조입니다.",
    mistake_reason:
      "나누는 분수를 역수로 바꾸는 핵심 절차를 생략하고 보이는 숫자끼리 바로 계산했습니다.",
    review_direction:
      "역수 변환의 의미를 먼저 확인하고, 비슷한 분수 나눗셈 3문제를 연속으로 풀어보세요.",
    review_topics: ["역수의 의미", "분수 나눗셈", "약분"],
    solution_steps: [
      "나눗셈 기호 뒤의 분수를 역수로 바꿉니다.",
      "분자끼리, 분모끼리 곱합니다.",
      "계산 결과를 약분하고 원래 문제에 맞는지 확인합니다.",
    ],
    solution_strategy:
      "나눗셈을 바로 계산하지 말고 역수의 곱셈으로 바꾼 뒤 처리하세요.",
    status: "pending",
    created_at: "2026-07-22T09:00:00.000Z",
  },
  {
    id: "sample-2",
    source_type: "direct",
    image_path: null,
    image_url: null,
    subject: "수학",
    unit: "일차방정식",
    question_title: "이항 후 계수 계산",
    problem_statement: "3x - 4 = x + 4에서 x의 값을 구하시오.",
    wrong_answer: "x항을 이항할 때 부호 변화를 놓쳐 답을 다르게 썼습니다.",
    correct_answer: "x = 4",
    provided_solution:
      "3x - 4 = x + 4에서 x항은 왼쪽으로, 숫자항은 오른쪽으로 모읍니다.\n3x - x = 4 + 4이므로 2x = 8입니다.\n양변을 2로 나누면 x = 4입니다.",
    explanation: "이항 과정에서 부호 변화를 확인하는 습관이 필요합니다.",
    pattern: "계산 실수",
    confidence: 84,
    correct_solution:
      "문제: 3x - 4 = x + 4에서 x의 값을 구하시오.\n\n정답: x = 4\n\n풀이:\n일차방정식은 x가 있는 항과 숫자만 있는 항을 서로 다른 쪽으로 모아 풉니다.\n3x - x = 4 + 4이므로 2x = 8입니다.\n양변을 2로 나누면 x = 4입니다.\n따라서 이 문제의 정답은 x = 4입니다.",
    detailed_explanation:
      "풀이 방향은 맞았지만 이항 과정에서 부호 변화를 놓치면 중간식이 달라집니다. 등식의 양쪽을 같은 값으로 바꾸는 과정이라는 점을 의식하면서 부호가 바뀌는 지점을 표시해야 합니다.",
    mistake_reason:
      "이항할 때 부호가 바뀌는 지점을 정확히 표시하지 않아 중간식이 틀어졌습니다.",
    review_direction:
      "이항 단계마다 부호 변화를 표시하고 마지막에 원래 식에 대입해 검산하세요.",
    review_topics: ["이항", "부호 변화", "검산"],
    solution_steps: [
      "문자가 있는 항과 숫자 항을 양쪽으로 분리합니다.",
      "항을 옮길 때 부호가 바뀌는지 표시합니다.",
      "구한 값을 원래 방정식에 넣어 양변이 같은지 확인합니다.",
    ],
    solution_strategy:
      "이항하는 순간을 표시하고, 마지막에는 반드시 원래 식으로 돌아가 검산하세요.",
    status: "done",
    created_at: "2026-07-21T12:30:00.000Z",
  },
  {
    id: "sample-3",
    source_type: "upload",
    image_path: null,
    image_url: null,
    subject: "수학",
    unit: "함수 그래프",
    question_title: "정의역 조건 확인",
    problem_statement:
      "함수 그래프에서 정의역이 -1 이상 3 이하일 때 최댓값을 구하시오.",
    wrong_answer: "그래프 모양만 보고 정의역 제한 조건을 반영하지 않았습니다.",
    correct_answer: "정의역 범위 안에서 가장 큰 y값",
    provided_solution: "",
    explanation: "문제의 범위 조건을 풀이 중 사용하지 않았습니다.",
    pattern: "정확한 풀이 필요",
    confidence: 58,
    correct_solution:
      "현재 로컬 분류기는 그래프 이미지의 좌표를 직접 읽어 최댓값을 계산할 수 없습니다.\n정확한 풀이가 필요하면 그래프 이미지를 첨부하고 정답을 입력한 뒤 AI 풀이 생성을 사용하세요.",
    detailed_explanation: "",
    mistake_reason:
      "그래프의 좌표 정보가 없어서 오답 원인을 단정하기 어렵습니다.",
    review_direction:
      "그래프 이미지나 좌표 정보를 넣은 뒤 AI 풀이 생성을 사용하세요.",
    review_topics: ["이미지 풀이 생성 필요"],
    solution_steps: [],
    solution_strategy: "",
    status: "reviewing",
    created_at: "2026-07-20T15:10:00.000Z",
  },
];
