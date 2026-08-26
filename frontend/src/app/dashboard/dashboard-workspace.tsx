"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { classifyWrongAnswer } from "@/lib/analysis/classifier";
import { sampleAnalyses } from "@/lib/analysis/sample-data";
import {
  analysisImageBucketName,
  analysisSettingsTableName,
  analysisTableName,
  type AnalysisInsert,
} from "@/lib/analysis/storage";
import type {
  AnalysisDraft,
  AnalysisRecord,
  AnalysisSettings,
  InputSource,
  ReviewStatus,
} from "@/lib/analysis/types";
import { createClient } from "@/lib/supabase/client";

const emptyDraft: AnalysisDraft = {
  source_type: "direct",
  subject: "수학",
  unit: "",
  question_title: "",
  problem_statement: "",
  wrong_answer: "",
  correct_answer: "",
  provided_solution: "",
  explanation: "",
};

const sourceLabels: Record<InputSource, string> = {
  direct: "직접 입력",
  upload: "이미지/파일 입력",
  database: "DB 기준",
};

const sourceDescriptions: Record<InputSource, string> = {
  direct: "문제 내용을 직접 적고 저장합니다.",
  upload: "이미지나 텍스트 파일을 첨부합니다.",
  database: "저장된 기록을 기준으로 누적 경향을 확인합니다.",
};

const selectableSourceTypes: InputSource[] = ["direct", "upload"];

const statusLabels: Record<ReviewStatus, string> = {
  pending: "복습 대기",
  reviewing: "복습 중",
  done: "완료",
};

const statusFilterLabels: Record<ReviewStatus | "all", string> = {
  all: "전체",
  pending: "대기",
  reviewing: "진행",
  done: "완료",
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

const defaultSettings: AnalysisSettings = {
  default_subject: "수학",
  default_source_type: "direct",
  auto_select_new_record: false,
  show_sample_records: false,
};

type DashboardWorkspaceProps = {
  userEmail: string | null;
};

export function DashboardWorkspace({ userEmail }: DashboardWorkspaceProps) {
  const [draft, setDraft] = useState<AnalysisDraft>(emptyDraft);
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);
  const [settings, setSettings] = useState<AnalysisSettings>(defaultSettings);
  const [schemaReady, setSchemaReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState("기록을 불러오는 중입니다.");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");

  useEffect(() => {
    let isMounted = true;

    async function loadRecords() {
      setIsLoading(true);

      const supabase = createClient();
      const [recordsResult, settingsResult] = await Promise.all([
        supabase
          .from(analysisTableName)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from(analysisSettingsTableName).select("*").maybeSingle(),
      ]);

      if (!isMounted) {
        return;
      }

      const nextSettings = settingsResult.data
        ? normalizeSettings(settingsResult.data)
        : defaultSettings;
      setSettings(nextSettings);
      setDraft((currentDraft) => ({
        ...currentDraft,
        source_type: nextSettings.default_source_type,
        subject: nextSettings.default_subject,
      }));

      if (recordsResult.error) {
        setSchemaReady(false);
        setRecords([]);
        setSelectedRecord(null);
        setSyncMessage("DB 설정을 확인해야 합니다. 입력한 문제는 임시로만 보일 수 있습니다.");
      } else {
        setSchemaReady(true);
        const loadedRecords = ((recordsResult.data ?? []) as AnalysisRecord[]).map(
          normalizeRecord,
        );
        const shouldUseSamples =
          loadedRecords.length === 0 && nextSettings.show_sample_records;
        const visibleRecords = shouldUseSamples ? sampleAnalyses : loadedRecords;

        setRecords(visibleRecords);
        setSelectedRecord(null);
        setSyncMessage(
          loadedRecords.length > 0
            ? "DB 기록을 불러왔습니다."
            : shouldUseSamples
              ? "저장된 기록이 없어 샘플을 표시합니다."
              : "아직 저장된 문제가 없습니다.",
        );
      }

      setIsLoading(false);
    }

    loadRecords();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const stats = useMemo(() => {
    const total = records.length;
    const patternCount = new Map<string, number>();
    const unitCount = new Map<string, number>();
    const pendingCount = records.filter((record) => record.status !== "done").length;
    const confidenceAverage =
      total === 0
        ? 0
        : Math.round(
            records.reduce((sum, record) => sum + record.confidence, 0) / total,
          );

    records.forEach((record) => {
      patternCount.set(record.pattern, (patternCount.get(record.pattern) ?? 0) + 1);
      unitCount.set(record.unit, (unitCount.get(record.unit) ?? 0) + 1);
    });

    return {
      confidenceAverage,
      patternEntries: Array.from(patternCount.entries()),
      pendingCount,
      topUnit: Array.from(unitCount.entries()).sort((a, b) => b[1] - a[1])[0],
      total,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records.filter((record) => {
      const matchesStatus =
        statusFilter === "all" ? true : record.status === statusFilter;
      const matchesQuery = query
        ? [
            record.subject,
            record.unit,
            record.question_title,
            record.pattern,
            record.problem_statement,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      return matchesStatus && matchesQuery;
    });
  }, [records, searchQuery, statusFilter]);

  const requiredProgress = [
    { label: "단원", done: Boolean(draft.unit.trim()) },
    { label: "문제", done: Boolean(draft.problem_statement.trim()) },
    { label: "내 답", done: Boolean(draft.wrong_answer.trim()) },
    { label: "정답", done: Boolean(draft.correct_answer.trim()) },
  ];
  const completedRequiredCount = requiredProgress.filter((item) => item.done).length;
  const isUploadMode = draft.source_type === "upload";
  const canGenerateSolution =
    isUploadMode &&
    Boolean(imageFile) &&
    Boolean(draft.correct_answer.trim()) &&
    !isGeneratingSolution;
  const aiButtonReason =
    isUploadMode && !imageFile
      ? "이미지를 첨부하면 AI 풀이를 만들 수 있습니다."
      : isUploadMode && !draft.correct_answer.trim()
        ? "정답을 먼저 입력해야 풀이를 생성합니다."
        : "이미지와 정답을 바탕으로 풀이를 생성합니다.";
  const problemStatementPlaceholder = isUploadMode
    ? "텍스트 파일을 불러오거나, 이미지에서 잘 안 보일 수 있는 조건을 추가로 적습니다."
    : "문제 본문, 조건, 보기를 직접 적습니다.";
  const solutionPlaceholder = isUploadMode
    ? "문제 이미지와 정답을 넣고 AI 풀이 생성을 누르거나, 직접 풀이를 적습니다."
    : "정답이 왜 맞는지 직접 풀이를 적습니다.";

  const overviewItems = [
    { label: "분석한 문제", value: String(stats.total), note: "내 기록 기준" },
    {
      label: "감지된 유형",
      value: String(stats.patternEntries.length),
      note: "오답 패턴",
    },
    {
      label: "복습 대기",
      value: String(stats.pendingCount),
      note: "미완료",
    },
    {
      label: "평균 신뢰도",
      value: `${stats.confidenceAverage}%`,
      note: "입력 충실도",
    },
  ];

  function updateDraft(field: keyof AnalysisDraft, value: string) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
  }

  function updateSource(sourceType: InputSource) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      source_type: sourceType,
    }));
    if (sourceType === "direct") {
      clearImage();
      setSyncMessage("직접 입력 모드입니다.");
    } else {
      setSyncMessage("이미지 또는 텍스트 파일을 첨부할 수 있습니다.");
    }
  }

  function normalizeRecord(record: AnalysisRecord): AnalysisRecord {
    return {
      ...record,
      image_path: record.image_path ?? null,
      image_url: record.image_url ?? null,
      problem_statement: record.problem_statement || record.question_title,
      provided_solution: record.provided_solution || "",
      review_topics: record.review_topics ?? [],
      solution_steps: record.solution_steps ?? [],
      correct_solution: record.correct_solution || "",
      detailed_explanation: record.detailed_explanation || "",
      mistake_reason:
        record.mistake_reason ||
        "정답 풀이와 내 풀이가 처음 달라지는 지점을 확인해야 합니다.",
      solution_strategy: record.solution_strategy || "",
    };
  }

  function normalizeSettings(value: Partial<AnalysisSettings>): AnalysisSettings {
    const defaultSourceType =
      value.default_source_type &&
      selectableSourceTypes.includes(value.default_source_type)
        ? value.default_source_type
        : defaultSettings.default_source_type;

    return {
      ...defaultSettings,
      ...value,
      auto_select_new_record: false,
      default_source_type: defaultSourceType,
    };
  }

  function updateSettings(field: keyof AnalysisSettings, value: string | boolean) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  }

  function resetDraft() {
    setDraft({
      ...emptyDraft,
      source_type: settings.default_source_type,
      subject: settings.default_subject,
    });
    clearImage();
    setSyncMessage("새 문제를 입력할 준비가 되었습니다.");
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setDraft((currentDraft) => ({
      ...currentDraft,
      source_type: "upload",
      question_title: currentDraft.question_title || file.name,
      problem_statement: text.slice(0, 1800),
    }));
    setSyncMessage("텍스트 파일 내용을 문제 입력칸에 반영했습니다.");
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      setSyncMessage("문제 이미지는 JPG, PNG, WebP 형식만 첨부할 수 있습니다.");
      return;
    }

    if (file.size > maxImageSize) {
      setSyncMessage("이미지는 5MB 이하만 첨부할 수 있습니다.");
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setDraft((currentDraft) => ({
      ...currentDraft,
      source_type: "upload",
      question_title: currentDraft.question_title || file.name,
    }));
    setSyncMessage("문제 이미지를 첨부했습니다. 정답을 입력하면 AI 풀이를 만들 수 있습니다.");
  }

  function clearImage() {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(null);
    setImagePreviewUrl(null);
  }

  function readImageAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("이미지를 읽지 못했습니다."));
        }
      });
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });
  }

  async function generateSolutionFromImage() {
    if (!imageFile) {
      setSyncMessage("문제 이미지를 먼저 첨부해주세요.");
      return;
    }

    if (!draft.correct_answer.trim()) {
      setSyncMessage("정답을 먼저 입력해야 AI 풀이를 생성할 수 있습니다.");
      return;
    }

    setIsGeneratingSolution(true);
    setSyncMessage("AI가 문제 이미지를 읽고 풀이를 생성하는 중입니다.");

    try {
      const imageDataUrl = await readImageAsDataUrl(imageFile);
      const response = await fetch("/api/solve-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correctAnswer: draft.correct_answer,
          imageDataUrl,
          problemStatement: draft.problem_statement,
          subject: draft.subject,
          unit: draft.unit,
          wrongAnswer: draft.wrong_answer,
        }),
      });
      const data = (await response.json()) as {
        detail?: string;
        error?: string;
        solution?: string;
      };

      if (!response.ok || !data.solution) {
        setSyncMessage(data.error ?? "AI 풀이 생성에 실패했습니다.");
        return;
      }

      setDraft((currentDraft) => ({
        ...currentDraft,
        provided_solution: data.solution ?? "",
      }));
      setSyncMessage("AI 풀이를 정답 풀이 입력칸에 반영했습니다.");
    } catch {
      setSyncMessage("AI 풀이 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingSolution(false);
    }
  }

  async function uploadImage(userId: string) {
    if (!imageFile) {
      return { imagePath: null, imageUrl: null, uploadError: null };
    }

    const supabase = createClient();
    const extension = imageFile.name.split(".").pop()?.toLowerCase() ?? "png";
    const safeName = imageFile.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9가-힣_-]/g, "-")
      .slice(0, 40);
    const imagePath = `${userId}/${Date.now()}-${safeName}.${extension}`;
    const { error } = await supabase.storage
      .from(analysisImageBucketName)
      .upload(imagePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { imagePath: null, imageUrl: imagePreviewUrl, uploadError: error };
    }

    const { data } = supabase.storage
      .from(analysisImageBucketName)
      .getPublicUrl(imagePath);

    return {
      imagePath,
      imageUrl: data.publicUrl,
      uploadError: null,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSyncMessage("분석 결과를 저장하는 중입니다.");

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const classification = classifyWrongAnswer(draft);
    const userId = userData.user?.id;
    const { imagePath, imageUrl, uploadError } = userId
      ? await uploadImage(userId)
      : { imagePath: null, imageUrl: imagePreviewUrl, uploadError: null };
    const insertPayload: AnalysisInsert = {
      ...draft,
      ...classification,
      image_path: imagePath,
      image_url: imageUrl,
      status: "pending",
      user_id: userId,
    };

    const { data, error } = await supabase
      .from(analysisTableName)
      .insert(insertPayload)
      .select("*")
      .single();

    const nextRecord: AnalysisRecord = normalizeRecord(
      error
        ? {
            ...insertPayload,
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString(),
          }
        : ((data as AnalysisRecord) ?? {
            ...insertPayload,
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString(),
          }),
    );

    setRecords((currentRecords) => [nextRecord, ...currentRecords]);
    setSelectedRecord(null);
    setDraft({
      ...emptyDraft,
      source_type: settings.default_source_type,
      subject: settings.default_subject,
    });
    clearImage();
    setSyncMessage(
      uploadError
        ? "이미지 업로드는 실패했지만 분석 기록은 화면에 반영했습니다. Storage 버킷 설정을 확인해주세요."
        : error
          ? "DB 저장에 실패해 이 화면에만 임시 반영했습니다. SQL 스키마와 권한을 확인해주세요."
          : "분석 결과를 저장했습니다. 최근 분석 기록에서 해당 문제를 클릭하면 결과를 열 수 있습니다.",
    );
    setIsSaving(false);
  }

  async function updateStatus(record: AnalysisRecord, status: ReviewStatus) {
    setRecords((currentRecords) =>
      currentRecords.map((currentRecord) =>
        currentRecord.id === record.id ? { ...currentRecord, status } : currentRecord,
      ),
    );
    setSelectedRecord((currentRecord) =>
      currentRecord?.id === record.id ? { ...currentRecord, status } : currentRecord,
    );

    if (record.id.startsWith("sample-") || record.id.startsWith("local-")) {
      setSyncMessage("샘플/임시 기록은 DB에 저장되지 않습니다.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from(analysisTableName)
      .update({ status })
      .eq("id", record.id);

    setSyncMessage(error ? "상태 저장에 실패했습니다." : "복습 상태를 저장했습니다.");
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingSettings(true);
    setSyncMessage("설정을 저장하는 중입니다.");

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setSyncMessage("로그인 세션을 확인해야 합니다.");
      setIsSavingSettings(false);
      return;
    }

    const payload: AnalysisSettings = {
      ...settings,
      auto_select_new_record: false,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from(analysisSettingsTableName)
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) {
      setSyncMessage("설정 저장에 실패했습니다.");
    } else {
      const nextSettings = normalizeSettings(data as AnalysisSettings);
      setSettings(nextSettings);
      setDraft((currentDraft) => ({
        ...currentDraft,
        source_type: nextSettings.default_source_type,
        subject: currentDraft.subject || nextSettings.default_subject,
      }));
      setSyncMessage("설정을 저장했습니다.");
    }

    setIsSavingSettings(false);
  }

  return (
    <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[220px_1fr]">
      <aside className="border border-[var(--line)] bg-white p-3 shadow-sm">
        <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {[
            ["분석", "analysis"],
            ["기록", "records"],
            ["통계", "stats"],
            ["설정", "settings"],
          ].map(([item, target], index) => (
            <a
              className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
                index === 0
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:bg-[var(--app-bg)] hover:text-[var(--app-fg)]"
              }`}
              href={`#${target}`}
              key={target}
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <section className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewItems.map((item) => (
            <article
              className="border border-[var(--line)] bg-white p-4 shadow-sm"
              key={item.label}
            >
              <p className="text-sm font-medium text-[var(--muted)]">
                {item.label}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <strong className="text-3xl font-bold">{item.value}</strong>
                <span className="rounded-lg bg-[var(--app-bg)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                  {item.note}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-col gap-2 border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)] shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong className="text-[var(--app-fg)]">상태</strong>
            <span className="ml-2">{isLoading ? "동기화 중" : syncMessage}</span>
          </p>
          <p className="text-xs">사용자: {userEmail ?? "세션 확인됨"}</p>
        </div>

        <section
          className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]"
          id="analysis"
        >
          <div className="border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">오답 입력</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  문제, 내 답, 정답을 넣으면 오답 유형과 복습 방향을 바로 정리합니다.
                </p>
              </div>
              <button
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--app-bg)]"
                onClick={resetDraft}
                type="button"
              >
                새 문제
              </button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {selectableSourceTypes.map((sourceType) => (
                <button
                  className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                    draft.source_type === sourceType
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--line)] bg-white text-[var(--muted)] hover:bg-[var(--app-bg)]"
                  }`}
                  key={sourceType}
                  onClick={() => updateSource(sourceType)}
                  type="button"
                >
                  <strong className="block">{sourceLabels[sourceType]}</strong>
                  <span className="mt-1 block text-xs leading-5">
                    {sourceDescriptions[sourceType]}
                  </span>
                </button>
              ))}
            </div>

            {isUploadMode ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 rounded-lg border border-dashed border-[var(--line)] bg-[var(--app-bg)] p-4 text-sm font-semibold">
                  파일 입력
                  <input accept=".txt,.md" onChange={handleUpload} type="file" />
                  <span className="text-xs font-medium text-[var(--muted)]">
                    TXT, MD 파일 내용을 문제 내용에 넣습니다.
                  </span>
                </label>
                <label className="grid gap-2 rounded-lg border border-dashed border-[var(--line)] bg-[var(--app-bg)] p-4 text-sm font-semibold">
                  이미지 입력
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    type="file"
                  />
                  <span className="text-xs font-medium text-[var(--muted)]">
                    JPG, PNG, WebP 이미지를 첨부합니다.
                  </span>
                </label>
              </div>
            ) : null}

            <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--app-bg)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  필수 입력 {completedRequiredCount}/{requiredProgress.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {requiredProgress.map((item) => (
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-bold ${
                        item.done
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-white text-[var(--muted)] ring-1 ring-[var(--line)]"
                      }`}
                      key={item.label}
                    >
                      {item.done ? "완료" : "필요"} · {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              {isUploadMode ? (
                <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--app-bg)] p-4 sm:col-span-2 sm:grid-cols-[220px_1fr]">
                  <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-white">
                    {imagePreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt="첨부한 문제 이미지 미리보기"
                        className="max-h-56 w-full object-contain"
                        src={imagePreviewUrl}
                      />
                    ) : (
                      <span className="px-4 text-center text-sm font-semibold text-[var(--muted)]">
                        이미지 없음
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-3">
                    <div>
                      <p className="text-sm font-bold">이미지 미리보기</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        이미지와 정답을 기준으로 Gemini 풀이를 생성합니다.
                      </p>
                    </div>
                    {imagePreviewUrl ? (
                      <button
                        className="w-fit rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-bold text-[var(--muted)]"
                        onClick={clearImage}
                        type="button"
                      >
                        이미지 제거
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <label className="grid gap-2 text-sm font-semibold">
                과목
                <input
                  className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) => updateDraft("subject", event.target.value)}
                  placeholder="예: 수학"
                  required
                  value={draft.subject}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                단원
                <input
                  className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) => updateDraft("unit", event.target.value)}
                  placeholder="예: 분수의 나눗셈"
                  required
                  value={draft.unit}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                문제 제목
                <input
                  className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateDraft("question_title", event.target.value)
                  }
                  placeholder="예: 분수 나눗셈 계산"
                  required
                  value={draft.question_title}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                문제 내용
                <textarea
                  className="min-h-32 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateDraft("problem_statement", event.target.value)
                  }
                  placeholder={problemStatementPlaceholder}
                  required
                  value={draft.problem_statement}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                내가 쓴 답과 풀이
                <textarea
                  className="min-h-28 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) => updateDraft("wrong_answer", event.target.value)}
                  placeholder="내가 적은 답, 풀이 과정, 헷갈린 부분을 적습니다."
                  required
                  value={draft.wrong_answer}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                문제의 정답
                <textarea
                  className="min-h-24 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateDraft("correct_answer", event.target.value)
                  }
                  placeholder="예: 3/2, x=4"
                  required
                  value={draft.correct_answer}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  정답 풀이
                  {isUploadMode ? (
                    <button
                      className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:text-[var(--muted)]"
                      disabled={!canGenerateSolution}
                      onClick={generateSolutionFromImage}
                      type="button"
                    >
                      {isGeneratingSolution ? "생성 중" : "AI 풀이 생성"}
                    </button>
                  ) : null}
                </span>
                <textarea
                  className="min-h-24 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateDraft("provided_solution", event.target.value)
                  }
                  placeholder={solutionPlaceholder}
                  value={draft.provided_solution}
                />
                {isUploadMode ? (
                  <span className="text-xs font-medium leading-5 text-[var(--muted)]">
                    {aiButtonReason}
                  </span>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                추가 메모
                <textarea
                  className="min-h-24 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) => updateDraft("explanation", event.target.value)}
                  placeholder="선생님 피드백, 내가 느낀 헷갈린 지점 등을 적습니다."
                  value={draft.explanation}
                />
              </label>
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--muted)]">
                  저장하면 새 기록이 맨 위에 추가됩니다. 결과는 기록에서 클릭해 열 수 있습니다.
                </p>
                <button
                  className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0c7779] disabled:bg-[var(--disabled)]"
                  disabled={isSaving || isGeneratingSolution}
                  type="submit"
                >
                  {isSaving ? "저장 중" : "분석하고 저장"}
                </button>
              </div>
            </form>
          </div>

          <ResultPanel
            selectedRecord={selectedRecord}
            statusLabels={statusLabels}
          />
        </section>

        <section
          className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
          id="stats"
        >
          <article className="border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">오답 유형 분포</h2>
            <div className="mt-5 grid gap-4">
              {stats.patternEntries.length > 0 ? (
                stats.patternEntries.map(([pattern, count]) => (
                  <div key={pattern}>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>{pattern}</span>
                      <span className="text-[var(--muted)]">{count}건</span>
                    </div>
                    <div className="mt-2 h-2 rounded-lg bg-[var(--app-bg)]">
                      <div
                        className="h-2 rounded-lg bg-[var(--accent)]"
                        style={{
                          width: `${Math.max(12, (count / stats.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  문제를 저장하면 유형 분포가 표시됩니다.
                </p>
              )}
            </div>
          </article>

          <article className="border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">취약 단원</h2>
            <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--app-bg)] p-4">
              <p className="text-sm font-semibold text-[var(--muted)]">
                현재 가장 많이 기록된 단원
              </p>
              <p className="mt-2 text-2xl font-bold">
                {stats.topUnit?.[0] ?? "아직 없음"}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {stats.topUnit
                  ? `${stats.topUnit[1]}건 누적`
                  : "오답을 저장하면 표시됩니다."}
              </p>
            </div>
          </article>
        </section>

        <section className="border border-[var(--line)] bg-white p-5 shadow-sm" id="records">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">최근 분석 기록</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                제목을 누르면 저장된 분석 결과를 열 수 있습니다.
              </p>
            </div>
            <span className="text-sm font-semibold text-[var(--accent)]">
              총 {records.length}건
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px]">
            <input
              className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="문제, 단원, 유형 검색"
              value={searchQuery}
            />
            <select
              className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm font-semibold outline-none focus:border-[var(--accent)] focus:bg-white"
              onChange={(event) =>
                setStatusFilter(event.target.value as ReviewStatus | "all")
              }
              value={statusFilter}
            >
              {Object.entries(statusFilterLabels).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 overflow-hidden border border-[var(--line)]">
            <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_90px_120px] bg-[var(--app-bg)] px-4 py-3 text-sm font-bold text-[var(--muted)] md:grid">
              <span>문항</span>
              <span>단원</span>
              <span>유형</span>
              <span>신뢰도</span>
              <span>상태</span>
            </div>
            {filteredRecords.map((record) => (
              <div
                className={`grid gap-3 border-t border-[var(--line)] px-4 py-4 text-sm transition md:grid-cols-[1fr_0.8fr_0.8fr_90px_120px] md:items-center ${
                  selectedRecord?.id === record.id
                    ? "bg-[var(--accent-soft)]"
                    : "hover:bg-[var(--app-bg)]"
                }`}
                key={record.id}
              >
                <button
                  className="text-left font-bold text-[var(--app-fg)] underline-offset-4 hover:underline"
                  onClick={() => setSelectedRecord(record)}
                  type="button"
                >
                  {record.question_title}
                  {record.image_url ? (
                    <span className="ml-2 rounded bg-white px-2 py-1 text-xs text-[var(--accent)] ring-1 ring-[var(--line)]">
                      이미지
                    </span>
                  ) : null}
                </button>
                <span className="text-[var(--muted)]">{record.unit}</span>
                <span className="text-[var(--muted)]">{record.pattern}</span>
                <span className="font-semibold">{record.confidence}%</span>
                <select
                  className="rounded-lg border border-[var(--line)] bg-white px-2 py-2 text-xs font-bold text-[var(--muted)]"
                  onChange={(event) =>
                    updateStatus(record, event.target.value as ReviewStatus)
                  }
                  value={record.status}
                >
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {filteredRecords.length === 0 ? (
              <div className="border-t border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                표시할 기록이 없습니다.
              </div>
            ) : null}
          </div>
        </section>

        <section className="border border-[var(--line)] bg-white p-5 shadow-sm" id="settings">
          <form className="grid gap-4" onSubmit={saveSettings}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">설정</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  기본 입력값과 샘플 표시 여부를 사용자별로 저장합니다.
                </p>
              </div>
              <span
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  schemaReady
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {schemaReady ? "DB 연결" : "설정 필요"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                기본 과목
                <input
                  className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateSettings("default_subject", event.target.value)
                  }
                  value={settings.default_subject}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                기본 입력 방식
                <select
                  className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateSettings(
                      "default_source_type",
                      event.target.value as InputSource,
                    )
                  }
                  value={settings.default_source_type}
                >
                  {selectableSourceTypes.map((sourceType) => (
                    <option key={sourceType} value={sourceType}>
                      {sourceLabels[sourceType]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
                <input
                  checked={settings.show_sample_records}
                  className="h-4 w-4 accent-[var(--accent)]"
                  onChange={(event) =>
                    updateSettings("show_sample_records", event.target.checked)
                  }
                  type="checkbox"
                />
                기록이 없을 때 샘플 표시
              </label>
            </div>

            <div className="flex justify-end">
              <button
                className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0c7779] disabled:bg-[var(--disabled)]"
                disabled={isSavingSettings}
                type="submit"
              >
                {isSavingSettings ? "저장 중" : "설정 저장"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  );
}

function ResultPanel({
  selectedRecord,
  statusLabels,
}: {
  selectedRecord: AnalysisRecord | null;
  statusLabels: Record<ReviewStatus, string>;
}) {
  return (
    <section className="border border-[var(--line)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">분석 결과</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            선택한 문제의 정답 풀이와 복습 방향입니다.
          </p>
        </div>
        <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          {selectedRecord ? statusLabels[selectedRecord.status] : "대기"}
        </span>
      </div>

      {selectedRecord ? (
        <div className="mt-6 grid gap-4">
          {selectedRecord.image_url ? (
            <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--app-bg)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`${selectedRecord.question_title} 문제 이미지`}
                className="max-h-64 w-full object-contain"
                src={selectedRecord.image_url}
              />
            </div>
          ) : null}
          <div className="rounded-lg border border-[var(--line)] p-4">
            <p className="text-sm font-semibold text-[var(--muted)]">오답 유형</p>
            <p className="mt-2 text-2xl font-bold">{selectedRecord.pattern}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] p-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-[var(--muted)]">신뢰도</span>
              <span>{selectedRecord.confidence}%</span>
            </div>
            <div className="mt-3 h-2 rounded-lg bg-[var(--app-bg)]">
              <div
                className="h-2 rounded-lg bg-[var(--accent)]"
                style={{ width: `${selectedRecord.confidence}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-700">왜 틀렸나</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6">
              {selectedRecord.mistake_reason}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--line)] p-4">
            <p className="text-sm font-semibold text-[var(--muted)]">
              문제의 옳은 풀이
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6">
              {selectedRecord.correct_solution}
            </p>
          </div>
          {selectedRecord.detailed_explanation ? (
            <div className="rounded-lg border border-[var(--line)] p-4">
              <p className="text-sm font-semibold text-[var(--muted)]">
                상세 해설
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6">
                {selectedRecord.detailed_explanation}
              </p>
            </div>
          ) : null}
          <div className="rounded-lg border border-[var(--line)] bg-[var(--accent-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--accent)]">
              추천 복습 방향
            </p>
            <p className="mt-2 text-sm leading-6">
              {selectedRecord.review_direction}
            </p>
          </div>
          {selectedRecord.solution_strategy ? (
            <div className="rounded-lg border border-[var(--line)] p-4">
              <p className="text-sm font-semibold text-[var(--muted)]">
                풀이 전략
              </p>
              <p className="mt-2 text-sm leading-6">
                {selectedRecord.solution_strategy}
              </p>
            </div>
          ) : null}
          {selectedRecord.solution_steps.length > 0 ? (
            <div className="rounded-lg border border-[var(--line)] p-4">
              <p className="text-sm font-semibold text-[var(--muted)]">
                풀이 순서
              </p>
              <ol className="mt-3 grid list-decimal gap-2 pl-5 text-sm leading-6">
                {selectedRecord.solution_steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}
          {selectedRecord.review_topics.length > 0 ? (
            <div className="rounded-lg border border-[var(--line)] p-4">
              <p className="text-sm font-semibold text-[var(--muted)]">
                복습할 것
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedRecord.review_topics.map((topic) => (
                  <span
                    className="rounded-lg bg-[var(--app-bg)] px-3 py-2 text-xs font-bold text-[var(--muted)]"
                    key={topic}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-[var(--line)] bg-[var(--app-bg)] p-5 text-sm leading-6 text-[var(--muted)]">
          저장된 기록의 제목을 클릭하면 분석 결과가 이곳에 열립니다.
        </p>
      )}
    </section>
  );
}
