import { motion } from "motion/react";
import { S } from "./KioskShared";

interface IdleWarningProps {
  countdown: number;
  onDismiss: () => void;
}

export function IdleWarning({ countdown, onDismiss }: IdleWarningProps) {
  return (
    <motion.div
      className="kiosk-idle"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onClick={onDismiss}
      role="alert"
      aria-live="polite"
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: S.sans,
            fontSize: "var(--fs-body)",
            color: "rgba(255,255,255,0.9)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          觸碰螢幕繼續
        </p>
        <p
          style={{
            fontFamily: S.sans,
            fontSize: "var(--fs-xs)",
            color: "rgba(255,255,255,0.5)",
            fontStyle: "italic",
            margin: "0.25rem 0 0",
          }}
        >
          Tap anywhere to continue
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.25rem",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: S.serif,
            fontSize: "var(--fs-h3)",
            fontWeight: 400,
            color: "var(--kiosk-accent)",
            lineHeight: 1,
          }}
        >
          {countdown}
        </span>
        <span
          style={{
            fontFamily: S.sans,
            fontSize: "var(--fs-xs)",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.06em",
          }}
        >
          秒後返回首頁
        </span>
      </div>
    </motion.div>
  );
}