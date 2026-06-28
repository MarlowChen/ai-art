import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { KioskHeader, S } from "./KioskShared";
import { publicAsset } from "../publicAsset";

export type AppScreen = "home" | "art";

interface HomeScreenProps {
  onSelect: (screen: AppScreen) => void;
}

const MOREU_WORDMARK_URL = publicAsset("/art-logo.png");

export function HomeScreen({ onSelect }: HomeScreenProps) {
  return (
    <div className="kiosk-screen art-home-screen">
      <KioskHeader />

      <div className="kiosk-main art-home-main">
        <section className="art-home-hero">
          <div className="kiosk-title-block kiosk-home-brand art-home-brand">
            <h1>
              <img src={MOREU_WORDMARK_URL} alt="Ai Art" />
            </h1>
            <p className="en">Prompt in. Art out.</p>
          </div>

          <div className="art-home-copy">
            <h2>輸入一句話，生成一張圖。</h2>
          </div>
        </section>

        <motion.button
          className="art-home-cta"
          onClick={() => onSelect("art")}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          aria-label="開始藝術生成"
        >
          <div className="art-home-cta__body">
            <span>開始生成</span>
          </div>
          <ArrowRight size={22} strokeWidth={1.4} aria-hidden />
        </motion.button>
      </div>

      <footer className="kiosk-footer art-home-footer">
        <p
          style={{
            fontFamily: S.sans,
            fontSize: "var(--fs-sm)",
            color: "var(--kiosk-mute)",
            margin: 0,
            textAlign: "center",
          }}
        >
          Tap to begin
        </p>
      </footer>
    </div>
  );
}
