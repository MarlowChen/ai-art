"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HomeScreen, type AppScreen } from "./components/HomeScreen";
import { IdleWarning } from "./components/IdleWarning";
import { ArtGenerateFlow } from "./components/ArtGenerateFlow";
import { IridescentField, Modal, GateContent } from "./components/KioskShared";
import "./kiosk.css";

const IDLE_THRESHOLD = 180;
const IDLE_COUNTDOWN = 30;

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [showIdle, setShowIdle] = useState(false);

  /* ------------------------------------------------------------
     Entry gate: shows the moment the kiosk is entered, and again
     every time an idle-timeout returns to Home (that's a new
     visitor walking up — they must agree too, not inherit the
     previous person's consent).
     ------------------------------------------------------------ */
  const [termsAgreed, setTermsAgreed] = useState(false);

  const resetIdle = useCallback(() => { setIdleSeconds(0); setShowIdle(false); }, []);

  useEffect(() => {
    if (screen === "home") { setIdleSeconds(0); setShowIdle(false); return; }
    const iv = setInterval(() => {
      setIdleSeconds((prev) => {
        const next = prev + 1;
        if (next >= IDLE_THRESHOLD) setShowIdle(true);
        if (next >= IDLE_THRESHOLD + IDLE_COUNTDOWN) {
          setScreen("home");
          setShowIdle(false);
          setTermsAgreed(false); // new visitor next -> ask again
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [screen]);

  const idleCountdown = Math.max(0, IDLE_COUNTDOWN - Math.max(0, idleSeconds - IDLE_THRESHOLD));
  const goHome = useCallback(() => { setScreen("home"); resetIdle(); }, [resetIdle]);

  const routes: Record<AppScreen, React.ReactNode> = {
    home: <HomeScreen onSelect={setScreen} />,
    art: <ArtGenerateFlow onHome={goHome} />,
  };

  return (
    <div className="kiosk-shell" data-screen={screen}>
      <IridescentField />

      <div className="kiosk-stage" onPointerDown={screen !== "home" ? resetIdle : undefined}>
        <AnimatePresence mode="wait">
          <motion.div
            className="kiosk-route"
            key={screen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {routes[screen]}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {showIdle && <IdleWarning countdown={idleCountdown} onDismiss={resetIdle} />}
        </AnimatePresence>
      </div>

      {/* Mandatory gate — no X, no backdrop-close. Sits above everything else. */}
      {!termsAgreed && (
        <Modal dismissible={false} onClose={() => {}}>
          <GateContent onAgree={() => setTermsAgreed(true)} />
        </Modal>
      )}
    </div>
  );
}
