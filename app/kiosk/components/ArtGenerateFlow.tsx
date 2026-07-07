"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { KioskHeader, BackButton, surgeParticles } from "./KioskShared";
import { publicAsset } from "../publicAsset";
import {
  generateArtRagImage,
  getArtRagTaskStatus,
  listArtRagLibraries,
  resolveApiMediaUrl,
  type ArtRagStatusResponse,
} from "../api";

interface ArtGenerateFlowProps {
  onHome: () => void;
}

type ArtStep = "compose" | "generating" | "result";
const DEFAULT_LIBRARY_ID = "6a427865c52167987909f130";
const MJ_MODEL_ID = "LegnextMidjourneyV7Image";
const HOST_LOGO_SRC = publicAsset("/logo.PNG");
const BANNER_SRC = publicAsset("/banner.jpg");

const STAGES = [
  "正在整理風格參考 · Aligning style references",
  "搜尋構圖與色彩關係 · Composing color & form",
  "AI 正在生成影像 · Rendering the image",
  "即將完成 · Almost there",
];

function extractImageUrl(item: unknown) {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item !== "object") return "";
  const img = item as { url?: string; originalUrl?: string; externalUrl?: string };
  return img.url || img.originalUrl || img.externalUrl || "";
}

function imageDedupeKey(url: string) {
  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.href : "https://local.invalid");
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0].split("#")[0];
  }
}

function canQrDownload(url: string) {
  return /^https?:\/\//i.test(url);
}

function resolveCompletedImages(data: ArtRagStatusResponse) {
  const candidates = [
    ...(data.images || []),
    ...(data.publishedImages || []),
    ...(data.resultUrls || []),
    ...(data.urls || []),
  ];
  const seen = new Set<string>();
  const images: string[] = [];
  for (const candidate of candidates) {
    const rawUrl = extractImageUrl(candidate);
    if (!rawUrl) continue;
    const resolvedUrl = resolveApiMediaUrl(rawUrl);
    const key = imageDedupeKey(resolvedUrl);
    if (seen.has(key)) continue;
    seen.add(key);
    images.push(resolvedUrl);
    if (images.length >= 4) break;
  }
  return images;
}

const fadeIn = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

export function ArtGenerateFlow({ onHome }: ArtGenerateFlowProps) {
  const [step, setStep] = useState<ArtStep>("compose");
  const [prompt, setPrompt] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState(STAGES[0]);
  const [error, setError] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [loadingLibraries, setLoadingLibraries] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await listArtRagLibraries();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "讀取資料庫失敗");
      } finally {
        if (!cancelled) setLoadingLibraries(false);
      }
    })();
    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== "generating") return;
    const iv = setInterval(() => {
      setElapsed((p) => {
        const n = p + 1;
        if (n % 3 === 0 && stageRef.current < STAGES.length - 1) {
          stageRef.current += 1;
          setStatus(STAGES[stageRef.current]);
        }
        return n;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [step]);

  async function poll(task: string) {
    try {
      const data = await getArtRagTaskStatus(task);
      if (data.status === "COMPLETED") {
        const imgs = resolveCompletedImages(data);
        if (imgs.length === 0) throw new Error("生成完成但沒有圖片");
        setImageUrls(imgs);
        setStep("result");
        return;
      }
      if (data.status === "FAILED") throw new Error("圖片生成失敗");
      pollRef.current = setTimeout(() => void poll(task), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "查詢任務失敗");
      setStep("compose");
    }
  }

  async function handleGenerate() {
    if (!prompt.trim()) { setError("請先輸入一句描述 · Please enter a prompt"); return; }
    if (pollRef.current) clearTimeout(pollRef.current);
    setError("");
    setSubmitting(true);
    setElapsed(0);
    stageRef.current = 0;
    setStatus(STAGES[0]);
    setStep("generating");
    surgeParticles();
    try {
      const result = await generateArtRagImage({
        libraryId: DEFAULT_LIBRARY_ID,
        query: prompt.trim(),
        aspectRatio: "1:1",
        resolution: "1K",
        outputFormat: "jpg",
        modelId: MJ_MODEL_ID,
      });
      void poll(result.taskId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交生成失敗");
      setStep("compose");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    if (pollRef.current) clearTimeout(pollRef.current);
    setStep("compose");
    setImageUrls([]);
    setSelectedImageUrl("");
    setElapsed(0);
    stageRef.current = 0;
    setStatus(STAGES[0]);
    setError("");
  }

  const SECT = { compose: "Your Prompt", generating: "In-Between", result: "Manifested" }[step];

  return (
    <div className="kiosk-screen">
      <KioskHeader sectionLabel={SECT} logoSrc={HOST_LOGO_SRC} />
      <div className="kiosk-topbar">
        <BackButton onHome={onHome} />
      </div>

      <div className="kiosk-main">
        {step === "compose" && (
          <motion.div className="compose compose--banner" {...fadeIn}>
            <div className="compose__banner">
              <img src={BANNER_SRC} alt="" />
              <div className="eyebrow">
                <span className="idx">01</span><span>Your Prompt</span><i>碳 · 你的提問</i>
              </div>
            </div>
            <div className="card">
              <label className="compose__label" htmlFor="art-prompt">一句話描述你想生成的畫面</label>
              <textarea
                id="art-prompt"
                className="compose__prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="輸入畫面描述"
              />
              <div className="compose__foot">
                <span className="compose__hint">一句話即可送出 · One sentence is enough</span>
                <button className="gen-btn" onClick={handleGenerate} disabled={loadingLibraries || submitting}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
                    <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                  </svg>
                  {submitting ? "送出中 · Sending" : "開始生成 · Generate"}
                </button>
              </div>
              {error && <p className="err">{error}</p>}
            </div>
          </motion.div>
        )}

        {step === "generating" && (
          <motion.div className="gen" {...fadeIn}>
            <div className="eyebrow eyebrow--center">
              <span className="idx">02</span><span>In-Between</span><i>之間 · 生成中</i>
            </div>
            <h2 className="gen__title">跨越之間</h2>
            <p className="gen__en">Crossing the space between carbon and silicon.</p>
            <p className="gen__poem">過去，創作需要長時間累積技法；<br />如今，你的一句話，正被轉譯成影像。</p>
            <div className="gen__status"><span className="dot" />{status}</div>
            <div className="gen__time">{elapsed}<span style={{ fontFamily: "var(--serif-en)", fontSize: ".6em" }}>s</span></div>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div className="result" {...fadeIn}>
            <div className="eyebrow">
              <span className="idx">03</span><span>Manifested</span><i>矽 · 成形</i>
            </div>
            <div className="result__grid">
              <div className={`result__gallery${imageUrls.length > 1 ? " result__gallery--multi" : ""}`}>
                {imageUrls.map((imageUrl, index) => (
                  <button
                    className="result__frame"
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageUrl(imageUrl)}
                    aria-label={`放大查看生成作品 ${index + 1}`}
                  >
                    <img src={imageUrl} alt={`Generated artwork ${index + 1}`} />
                    {index === 0 && <div className="result__cap">“{prompt.length > 42 ? prompt.slice(0, 42) + "…" : prompt}”</div>}
                  </button>
                ))}
              </div>
              <div className="result__meta">
                <p className="result__q">也許答案不在於誰完成了作品，<br />而在於誰提出了問題、做出了選擇，<br />誰賦予作品意義。</p>
                <div className="result__downloads">
                  <div className="result__downloads-head">
                    <b>掃碼下載作品</b>
                    <span>每張圖各自掃描 · Scan each artwork</span>
                  </div>
                  <div className="result__download-grid">
                    {imageUrls.map((imageUrl, index) => (
                      <div className="result__download" key={`download-${imageUrl}-${index}`}>
                        <button type="button" className="result__download-preview" onClick={() => setSelectedImageUrl(imageUrl)}>
                          <img src={imageUrl} alt={`Artwork ${index + 1} preview`} />
                          <span>{String(index + 1).padStart(2, "0")}</span>
                        </button>
                        <div className="result__download-qr">
                          {canQrDownload(imageUrl) ? (
                            <QRCodeSVG value={imageUrl} size={160} level="M" marginSize={1} />
                          ) : (
                            <span>無法產生 QR</span>
                          )}
                        </div>
                        <a className="result__download-link" href={imageUrl} target="_blank" rel="noreferrer" download>
                          下載第 {index + 1} 張
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="gen-btn" onClick={reset}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
                    <path d="M4 12a8 8 0 018-8 8 8 0 016.9 4M20 12a8 8 0 01-8 8 8 8 0 01-6.9-4M4 6v4h4M20 18v-4h-4" />
                  </svg>
                  再創作一次 · Again
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {selectedImageUrl && (
        <div className="result-lightbox" role="dialog" aria-modal="true" aria-label="生成作品放大檢視" onClick={() => setSelectedImageUrl("")}>
          <button className="result-lightbox__close" type="button" onClick={() => setSelectedImageUrl("")} aria-label="關閉作品">
            ×
          </button>
          <img src={selectedImageUrl} alt="生成作品放大檢視" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
