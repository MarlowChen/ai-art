import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { BackButton, KioskHeader, QRCodeMock, TitleBlock } from "./KioskShared";
import {
  generateArtRagImage,
  getArtRagTaskStatus,
  listArtRagLibraries,
} from "../api";

interface ArtGenerateFlowProps {
  onHome: () => void;
}

type ArtStep = "compose" | "generating" | "result";
const DEFAULT_LIBRARY_ID = "6a427865c52167987909f130";
const MJ_MODEL_ID = "LegnextMidjourneyV7Image";

const PROMPT_SUGGESTIONS = [
  "一隻小狗在印象派花園裡奔跑，陽光柔軟，筆觸輕盈",
  "東京街頭夜雨中的女孩，電影感，霓虹反射，帶一點復古海報氣質",
  "海邊散步的白色洋裝人物，像雜誌封面一樣乾淨高級",
];

function resolveCompletedImages(images?: Array<{ url?: string }>) {
  return images?.map((item) => item?.url).filter((url): url is string => Boolean(url)) || [];
}

export function ArtGenerateFlow({ onHome }: ArtGenerateFlowProps) {
  const [step, setStep] = useState<ArtStep>("compose");
  const [prompt, setPrompt] = useState(PROMPT_SUGGESTIONS[0]);
  const [taskId, setTaskId] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("正在整理風格參考");
  const [styleSummary, setStyleSummary] = useState("");
  const [error, setError] = useState("");
  const [loadingLibraries, setLoadingLibraries] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        await listArtRagLibraries();
        if (cancelled) return;
      } catch (nextError) {
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : "讀取資料庫失敗");
      } finally {
        if (!cancelled) setLoadingLibraries(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== "generating") return;
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [step]);

  async function poll(task: string) {
    try {
      const data = await getArtRagTaskStatus(task);
      if (data.status === "COMPLETED") {
        const nextImages = resolveCompletedImages(data.images);
        if (nextImages.length === 0) throw new Error("生成完成但沒有圖片");
        setImageUrls(nextImages);
        setStatus("生成完成");
        setStep("result");
        return;
      }
      if (data.status === "FAILED") throw new Error("圖片生成失敗");
      setStatus(data.status || "AI 正在生成");
      pollRef.current = setTimeout(() => {
        void poll(task);
      }, 2500);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "查詢任務失敗");
      setStep("compose");
    }
  }

  async function handleGenerate() {
    if (!prompt.trim()) return setError("請先輸入描述");
    if (pollRef.current) clearTimeout(pollRef.current);

    setError("");
    setSubmitting(true);
    setElapsed(0);
    setStatus("正在整理風格參考");
    setStep("generating");

    try {
      const result = await generateArtRagImage({
        libraryId: DEFAULT_LIBRARY_ID,
        query: prompt.trim(),
        aspectRatio: "1:1",
        resolution: "1K",
        outputFormat: "jpg",
        modelId: MJ_MODEL_ID,
      });
      setTaskId(result.taskId);
      setStyleSummary(
        result.discoveredStyle
          ? [result.discoveredStyle.style, result.discoveredStyle.period, result.discoveredStyle.artist]
              .filter(Boolean)
              .join(" / ")
          : result.styleSource === "random"
            ? "系統自動挑選風格方向"
            : "依照你的輸入搜尋風格方向",
      );
      void poll(result.taskId);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "提交生成失敗");
      setStep("compose");
    } finally {
      setSubmitting(false);
    }
  }

  function resetFlow() {
    if (pollRef.current) clearTimeout(pollRef.current);
    setStep("compose");
    setTaskId("");
    setImageUrls([]);
    setElapsed(0);
    setStatus("正在整理風格參考");
    setStyleSummary("");
    setError("");
  }

  return (
    <div className="kiosk-screen art-flow-screen">
      <KioskHeader sectionLabel="Art Generator" />
      <div className="art-flow-topbar">
        <BackButton onHome={onHome} />
      </div>

      {step === "compose" && (
        <motion.div className="kiosk-main art-flow-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="art-compose__hero">
            <TitleBlock level={1} zh="輸入你的畫面" en="Describe one scene." />
          </div>
          <section className="art-panel art-panel--single">
            <textarea className="art-prompt-textarea" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={7} placeholder="例如：東京街頭夜雨中的女孩，電影感，霓虹反射" />
            <div className="art-panel__actions art-panel__actions--center">
              <button className="kiosk-btn kiosk-btn--primary" type="button" onClick={handleGenerate} disabled={loadingLibraries || submitting}>
                <Sparkles size={18} strokeWidth={1.5} aria-hidden />
                {submitting ? "送出中" : "開始生成"}
              </button>
            </div>
            {error && <p className="art-error-text">{error}</p>}
          </section>
        </motion.div>
      )}

      {step === "generating" && (
        <motion.div className="kiosk-main art-flow-main art-generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TitleBlock level={1} zh="AI 正在生成" en="Generating image." />
          <div className="art-status-card">
            <div className="art-status-card__body"><strong>{status}</strong><p>{styleSummary || "請稍候"}</p></div>
            <span className="art-status-card__time">{elapsed}s</span>
          </div>
        </motion.div>
      )}

      {step === "result" && (
        <motion.div className="kiosk-main art-flow-main art-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TitleBlock level={1} zh="已完成" en="Done." />
          <div className="art-result__grid">
            {imageUrls.map((imageUrl, index) => (
              <div className="art-result__image-wrap" key={`${imageUrl}-${index}`}>
                <img className="art-result__image" src={imageUrl} alt={`Generated art result ${index + 1}`} />
              </div>
            ))}
            <div className="art-result__meta">
              <QRCodeMock value={imageUrls[0] || ""} caption="掃碼下載" />
              <button className="kiosk-btn kiosk-btn--primary" type="button" onClick={resetFlow}>
                <Sparkles size={18} strokeWidth={1.5} aria-hidden />
                再來一張
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
