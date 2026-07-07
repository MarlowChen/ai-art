"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { publicAsset } from "../publicAsset";
import { KioskHeader, KioskFooter, Modal, AboutContent, TermsContent } from "./KioskShared";

const HOST_LOGO_SRC = publicAsset("/logo.PNG");
const POSTER_SRC = publicAsset("/post.jpg");

export type AppScreen = "home" | "art";

interface HomeScreenProps {
  onSelect: (screen: AppScreen) => void;
}

export function HomeScreen({ onSelect }: HomeScreenProps) {
  const [modal, setModal] = useState<null | "about" | "terms" | "poster">(null);

  return (
    <div className="kiosk-screen">
      <KioskHeader sectionLabel="AI Artwork Model" logoSrc={HOST_LOGO_SRC} />
      <div className="kiosk-topbar" />

      <div className="kiosk-main">
        <motion.section
          className="home home--with-media"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className="home__copy">
            <p className="home__label">碳矽之間 · 專屬藝術模型</p>
            <h1 className="home__title">在這裡，每個人<br />都是創作者</h1>
            <p className="home__en">Here, every visitor becomes a creator.</p>
            <p className="home__sub">輸入一句話，讓想像成形 <em>Prompt in, art out.</em></p>
            <p className="home__lede">
              只需一句文字、一個念頭，甚至一個尚未成形的概念，人工智慧便將抽象的語言轉化為具體的影像。這場共創，關於創作、真實與存在。
            </p>

            <div className="home__actions">
              <motion.button className="cta" onClick={() => onSelect("art")} whileHover={{ y: -3 }} whileTap={{ scale: 0.99 }}>
                開始共創
                <span className="en">Start Creating</span>
                <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </motion.button>
            </div>

            <div className="home__links">
              <button className="ghost" onClick={() => setModal("about")}>
                關於這件作品 <span style={{ fontFamily: "var(--serif-en-body)", fontStyle: "italic" }}>· About</span>
              </button>
              <span aria-hidden>·</span>
              <button className="ghost" onClick={() => setModal("terms")}>
                使用條款與著作權聲明 <span style={{ fontFamily: "var(--serif-en-body)", fontStyle: "italic" }}>· Terms</span>
              </button>
            </div>

            <p className="home__consent">
              已同意使用條款 <span style={{ fontFamily: "var(--serif-en-body)", fontStyle: "italic" }}>· Terms agreed</span>
            </p>
          </div>

          <aside className="home__media" aria-label="展覽主視覺">
            <button className="home__poster" type="button" onClick={() => setModal("poster")} aria-label="放大查看展覽海報">
              <img src={POSTER_SRC} alt="碳矽之間展覽主視覺" />
              <span className="home__poster-hint">點選放大 · View</span>
            </button>
          </aside>
        </motion.section>
      </div>

      <KioskFooter onTerms={() => setModal("terms")} />

      {modal === "about" && (
        <Modal onClose={() => setModal(null)}>
          <AboutContent onStart={() => { setModal(null); onSelect("art"); }} />
        </Modal>
      )}
      {modal === "terms" && (
        <Modal onClose={() => setModal(null)}>
          <TermsContent onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === "poster" && (
        <div className="poster-lightbox" role="dialog" aria-modal="true" aria-label="展覽海報放大檢視" onClick={() => setModal(null)}>
          <button className="poster-lightbox__close" type="button" onClick={() => setModal(null)} aria-label="關閉海報">
            ×
          </button>
          <img src={POSTER_SRC} alt="碳矽之間展覽海報" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
