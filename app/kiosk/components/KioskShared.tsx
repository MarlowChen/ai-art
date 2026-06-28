import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { buildApiUrl } from "../api";
import { publicAsset } from "../publicAsset";

const MOREU_WORDMARK_URL = publicAsset("/art-logo.png");

/* ============================================================
   Clock
   ============================================================ */
export function useClock() {
  const [time, setTime] = useState(() => formatTime(new Date()));
  useEffect(() => {
    const iv = setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => clearInterval(iv);
  }, []);
  return time;
}

function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ============================================================
   Header — 三段式：品牌 / section / 時間
   小螢幕 section label 自動隱藏（CSS 媒體查詢）
   ============================================================ */
interface KioskHeaderProps {
  sectionLabel?: string;
}

export function KioskHeader({ sectionLabel }: KioskHeaderProps) {
  const time = useClock();
  return (
    <header className="kiosk-header">
      <img className="kiosk-header__logo" src={MOREU_WORDMARK_URL} alt="Ai Art" />

      {sectionLabel && (
        <span
          className="kiosk-header__section"
          style={{
            textTransform: "uppercase",
            color: "var(--kiosk-accent)",
            fontWeight: 500,
          }}
        >
          {sectionLabel}
        </span>
      )}

      <span style={{ color: "var(--kiosk-mute)" }}>{time}</span>
    </header>
  );
}

/* ============================================================
   Back button
   ============================================================ */
export function BackButton({ onHome }: { onHome: () => void }) {
  return (
    <button className="kiosk-back" onClick={onHome} aria-label="返回首頁">
      <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
      返回首頁
    </button>
  );
}

/* ============================================================
   QR Code
   ============================================================ */
export function QRCodeMock({ caption = "掃我帶回家", value }: { caption?: string; value?: string }) {
  const qrValue = normalizeQrValue(value);
  const displayCaption = qrValue ? caption : "等待連結";

  return (
    <div style={{ textAlign: "center" }}>
      <div className="kiosk-qr" role="img" aria-label="QR code">
        {qrValue ? (
          <QRCodeSVG
            value={qrValue}
            size={280}
            level="L"
            marginSize={2}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        ) : (
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--kiosk-mute)" }}>
            等待連結
          </span>
        )}
      </div>
      <p
        style={{
          fontSize: "var(--fs-sm)",
          color: "var(--kiosk-sub)",
          margin: "var(--sp-sm) 0 0",
          fontFamily: "var(--kiosk-sans)",
        }}
      >
        {displayCaption}
      </p>
      {qrValue && (
        <a
          href={qrValue}
          target="_blank"
          rel="noreferrer"
          className="kiosk-qr__link"
        >
          開啟下載連結
        </a>
      )}
    </div>
  );
}

function normalizeQrValue(value?: string) {
  if (!value) return "";
  if (value.startsWith("data:")) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return buildApiUrl(value);
  if (typeof window !== "undefined") return new URL(value, window.location.href).toString();
  return value;
}

/* ============================================================
   Loading bar
   ============================================================ */
interface LoadingBarProps {
  onComplete?: () => void;
  duration?: number;
  label?: string;
  sublabel?: string;
}

export function LoadingBar({
  onComplete,
  duration = 4000,
  label = "AI 正在為你修圖中",
  sublabel = "預計 30 秒",
}: LoadingBarProps) {
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const start = Date.now();
    let doneTimer: ReturnType<typeof setTimeout> | undefined;
    const iv = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setProgress(p);
      if (p >= 1) {
        clearInterval(iv);
        doneTimer = setTimeout(() => onCompleteRef.current?.(), 300);
      }
    }, 50);
    return () => {
      clearInterval(iv);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [duration]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--sp-lg)",
        width: "100%",
      }}
    >
      <p
        style={{
          fontFamily: "var(--kiosk-serif)",
          fontSize: "var(--fs-title)",
          color: "var(--kiosk-ink)",
          margin: 0,
          fontWeight: 400,
          textAlign: "center",
        }}
      >
        {label}
      </p>
      <div
        className="kiosk-progress"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="kiosk-progress__fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p
        style={{
          fontFamily: "var(--kiosk-sans)",
          fontSize: "var(--fs-sm)",
          color: "var(--kiosk-mute)",
          margin: 0,
          textAlign: "center",
        }}
      >
        {sublabel}
      </p>
    </div>
  );
}

/* ============================================================
   Divider
   ============================================================ */
export function Divider({ short = false }: { short?: boolean }) {
  return <div className={`kiosk-divider${short ? " kiosk-divider--short" : ""}`} />;
}

/* ============================================================
   Title block — Chinese hero + English subtitle
   ============================================================ */
interface TitleBlockProps {
  zh: string;
  en: string;
  level?: 1 | 2;
}

export function TitleBlock({ zh, en, level = 2 }: TitleBlockProps) {
  return (
    <div className="kiosk-title-block">
      {level === 1 ? <h1>{zh}</h1> : <h2>{zh}</h2>}
      <p className="en">{en}</p>
    </div>
  );
}

/* ============================================================
   Style tokens (kept for inline-style call sites)
   ============================================================ */
export const S = {
  serif: "var(--kiosk-serif)",
  sans: "var(--kiosk-sans)",
};
