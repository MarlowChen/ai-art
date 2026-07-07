"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { buildApiUrl } from "../api";

/* ============================================================
   Clock
   ============================================================ */
export function useClock() {
  const [time, setTime] = useState(() => fmt(new Date()));
  useEffect(() => {
    const iv = setInterval(() => setTime(fmt(new Date())), 15000);
    return () => clearInterval(iv);
  }, []);
  return time;
}
function fmt(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ============================================================
   Iridescent field + poster axis labels (mount once in App)
   ============================================================ */
export function IridescentField() {
  return (
    <>
      <div className="field" aria-hidden />
      <ParticleField />
      <span className="axis axis--carbon">Human Creation · 碳</span>
      <span className="axis axis--silicon">AI Generation · 矽</span>
    </>
  );
}

/* ============================================================
   Signature: carbon particles crossing to silicon.
   Ambient always; call surgeParticles() during generation.
   ============================================================ */
type P = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; c: string };
const CARBON = ["#D07AA0", "#E0A6C0", "#8FA6DE", "#B6CDE5", "#F0C98A", "#9BD0C8", "#B49BD8"];

export function ParticleField() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0, surging = 0;
    const parts: P[] = [];

    const resize = () => {
      W = cv.width = innerWidth * DPR;
      H = cv.height = innerHeight * DPR;
      cv.style.width = innerWidth + "px";
      cv.style.height = innerHeight + "px";
    };
    resize();
    addEventListener("resize", resize);

    const spawn = (n: number, burst: boolean) => {
      for (let i = 0; i < n; i++)
        parts.push({
          x: burst ? W * 0.12 + Math.random() * W * 0.1 : Math.random() * W * 0.35,
          y: Math.random() * H,
          vx: (0.15 + Math.random() * 0.5) * DPR * (burst ? 2.4 : 1),
          vy: (Math.random() - 0.5) * 0.25 * DPR,
          r: (1 + Math.random() * 2.6) * DPR,
          life: 0,
          max: 260 + Math.random() * 220,
          c: CARBON[(Math.random() * CARBON.length) | 0],
        });
    };
    spawn(70, false);
    (window as unknown as { __csSurge?: () => void }).__csSurge = () => (surging = 90);

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      if (!reduce) {
        if (parts.length < 90) spawn(2, false);
        if (surging > 0) { spawn(3, true); surging--; }
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.life++; p.x += p.vx; p.y += p.vy; p.vx *= 1.001;
          const prog = p.x / W;
          const fade = Math.min(1, p.life / 40) * (1 - Math.max(0, (p.life - p.max * 0.6) / (p.max * 0.4)));
          ctx.beginPath();
          ctx.fillStyle = p.c;
          ctx.globalAlpha = Math.max(0, fade * (0.85 - prog * 0.55));
          ctx.arc(p.x, p.y, Math.max(0.3, p.r * (1 - prog * 0.5)), 0, 7);
          ctx.fill();
          if (p.x > W * 1.02 || p.life > p.max) parts.splice(i, 1);
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="particles" aria-hidden />;
}

export function surgeParticles() {
  (window as unknown as { __csSurge?: () => void }).__csSurge?.();
}

/* ============================================================
   Logo slot — reserved space, empty by default.
   Drop your file in /public (e.g. /public/logo.png) and pass
   its path via `src` once you have it — the box is a fixed
   size so nothing reflows when the image appears.
   ============================================================ */
export function LogoSlot({
  src,
  alt = "Logo",
  size = "header",
}: {
  src?: string;
  alt?: string;
  size?: "header" | "footer" | "hero";
}) {
  return (
    <div className={`kiosk-logo kiosk-logo--${size} ${src ? "" : "kiosk-logo--empty"}`}>
      {src ? <img src={src} alt={alt} /> : <span>LOGO</span>}
    </div>
  );
}

/* ============================================================
   Header / Back / Footer
   ============================================================ */
export function KioskHeader({ sectionLabel, logoSrc }: { sectionLabel?: string; logoSrc?: string }) {
  const time = useClock();
  return (
    <header className="kiosk-header">
      <div className="kiosk-header__brand">
        <LogoSlot src={logoSrc} size="header" alt="碳矽之間" />
        <div className="kiosk-header__brand-text">
          <b>碳矽之間</b>
          <span>Between Carbon &amp; Silicon</span>
        </div>
      </div>
      <div className="kiosk-header__meta">
        {sectionLabel && <span className="sect">{sectionLabel}</span>}
        <span>{time}</span>
      </div>
    </header>
  );
}

export function BackButton({ onHome }: { onHome: () => void }) {
  return (
    <button className="kiosk-back" onClick={onHome} aria-label="返回首頁">
      ← 返回首頁 · Home
    </button>
  );
}

export function KioskFooter({ onTerms }: { onTerms: () => void }) {
  return (
    <footer className="kiosk-footer">
      <span className="kiosk-footer__host">
        主辦 <b>朋思富實業</b> PENG SI FU INDUSTRIAL CO., LTD.
      </span>
      <span className="kiosk-footer__right">
        <button onClick={onTerms}>使用條款 · Terms</button>
        <span>·</span>
        <span>臺中國家歌劇院 悠然廳</span>
      </span>
    </footer>
  );
}

/* ============================================================
   QR
   ============================================================ */
export function QRCodeMock({ value, caption = "掃碼帶走你的作品 · Scan to keep" }: { value?: string; caption?: string }) {
  const qr = normalizeQr(value);
  return (
    <>
      <div className="kiosk-qr" role="img" aria-label="QR code">
        {qr ? (
          <QRCodeSVG value={qr} size={280} level="M" marginSize={1} style={{ width: "100%", height: "100%" }} />
        ) : (
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--ink-dark-mute)" }}>等待連結</span>
        )}
      </div>
      <p className="kiosk-qr__cap">{qr ? caption : "等待連結 · Waiting"}</p>
    </>
  );
}
function normalizeQr(v?: string) {
  if (!v) return "";
  if (v.startsWith("data:")) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("/")) return buildApiUrl(v);
  if (typeof window !== "undefined") return new URL(v, window.location.href).toString();
  return v;
}

/* ============================================================
   Modal shell.
   `dismissible=false` removes the X button and disables
   backdrop/Escape close — used only by the entry Gate.
   ============================================================ */
export function Modal({
  children,
  onClose,
  dismissible = true,
}: {
  children: React.ReactNode;
  onClose: () => void;
  dismissible?: boolean;
}) {
  useEffect(() => {
    if (!dismissible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose, dismissible]);

  return (
    <div
      className="scrim"
      onClick={(e) => dismissible && e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true">
        {dismissible && (
          <button className="modal__x" onClick={onClose} aria-label="關閉">×</button>
        )}
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   Legal / about content
   ============================================================ */
export function AboutContent({ onStart }: { onStart: () => void }) {
  return (
    <>
      <h3>碳矽之間 專屬藝術模型</h3>
      <p className="en-h">Between Creation · AI Artwork Model</p>
      <p className="lead">在這裡，每一位觀眾都將成為創作者。只需輸入一句文字、一個想法，甚至一個尚未完整成形的概念，人工智慧便會將抽象的語言轉化為具體的影像。</p>
      <p>本展所使用的生成模型，由團隊結合古典藝術、現代藝術與當代視覺美學進行持續調校，讓 AI 能理解不同的藝術語彙、構圖邏輯、色彩關係與創作風格，使每一次生成都兼具藝術性與獨特性。</p>
      <p>過去，創作需要長時間累積技法與經驗；如今，生成式 AI 大幅降低了創作門檻。這不只是技術的進步，更重新定義了「創作」本身。然而，本展真正想討論的並不是 AI 能畫得多好——</p>
      <p className="big-q">當創作變得如此容易時，人類的價值將存在於何處？</p>
      <p>也許答案不在於誰完成了作品，而在於誰提出了問題、誰做出了選擇，以及誰賦予作品真正的意義。</p>
      <hr />
      <p className="en-sub">When creation becomes effortless, where does human value reside? Perhaps not in who produced the image, but in who asked the question, who made the choices, and who gave the work its meaning.</p>
      <div className="modal__actions">
        <button className="gen-btn" onClick={onStart}>開始共創 · Start Creating</button>
      </div>
    </>
  );
}

const TERMS_ITEMS: { zh: React.ReactNode; en: string }[] = [
  {
    zh: <>創作概念、提示語（Prompt）與原始內容由參與者提供。</>,
    en: "The creative concept, prompts, and original content are provided by the participant.",
  },
  {
    zh: <>AI 生成流程、平台及相關技術，由 <strong>朋思富實業有限公司（PENG SI FU INDUSTRIAL CO., LTD.）</strong> 開發、營運與維護。</>,
    en: "The AI generation workflow, platform, and related technologies are developed, operated, and maintained by PENG SI FU INDUSTRIAL CO., LTD.",
  },
  {
    zh: <>參與者依適用法律保有其創作貢獻之權利；當 AI 共創作品符合著作權保護要件時，其著作權原則上歸屬於參與者。</>,
    en: "Participants retain rights to their contributions under applicable law; copyright shall in principle belong to the participant where the work is eligible for protection.",
  },
  {
    zh: <>參與者授予主辦單位 <strong>全球、非專屬、免權利金之授權</strong>，得為展覽、出版、教育推廣、學術研究、官方網站、社群媒體及宣傳等目的，使用、重製、公開展示、發行與傳播所生成之作品，無須另行取得同意或給付報酬。</>,
    en: "Participants grant the organizer a worldwide, non-exclusive, royalty-free license to use, reproduce, display, publish, distribute, and communicate the works for exhibition, publication, education, research, official channels, and promotion.",
  },
  {
    zh: <>參與者聲明並保證所提交之內容未侵害任何第三人之智慧財產權、人格權或其他合法權利，並就相關爭議自行負責。</>,
    en: "Participants warrant that submitted content does not infringe any third-party rights and are solely responsible for any resulting disputes.",
  },
];

/** Reusable terms body. `compact` drops the bilingual per-item English lines (used in the quick footer viewer). */
function TermsBody({ compact = false }: { compact?: boolean }) {
  return (
    <ol>
      {TERMS_ITEMS.map((item, i) => (
        <li key={i}>
          {item.zh}
          {!compact && <><br /><span className="en-sub">{item.en}</span></>}
        </li>
      ))}
    </ol>
  );
}

/** The mandatory entry gate. No X, no backdrop-close — only the agree button proceeds. */
export function GateContent({ onAgree }: { onAgree: () => void }) {
  return (
    <>
      <span className="gate-badge">請先閱讀 · Please read before entering</span>
      <h3>使用條款與著作權聲明</h3>
      <p className="en-h">Terms of Use &amp; Copyright Notice</p>
      <p className="lead">歡迎參與「碳矽之間」共創。開始之前，請詳閱以下條款：</p>
      <TermsBody />
      <hr />
      <p className="lead">
        點選「我同意，開始共創」即表示您已閱讀並同意上述條款。<br />
        <span className="en-sub" style={{ fontSize: ".9em" }}>
          By clicking &ldquo;Agree &amp; Start,&rdquo; you acknowledge that you have read and agree to these terms.
        </span>
      </p>
      <div className="modal__actions">
        <button className="gen-btn" onClick={onAgree}>我同意，開始共創 · Agree &amp; Start</button>
      </div>
    </>
  );
}

/** Re-viewable terms (footer / home link). Has a close button, no forced action. */
export function TermsContent({ onClose }: { onClose: () => void }) {
  return (
    <>
      <h3>使用條款與著作權聲明</h3>
      <p className="en-h">Terms of Use &amp; Copyright Notice</p>
      <p className="lead">當您使用本平台，即表示您已閱讀、瞭解並同意下列條款：</p>
      <TermsBody compact />
      <div className="modal__actions">
        <button className="ghost" style={{ color: "var(--ink-dark-soft)" }} onClick={onClose}>關閉 · Close</button>
      </div>
    </>
  );
}
