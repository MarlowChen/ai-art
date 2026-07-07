"use client";

import { motion } from "motion/react";

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
      <div className="kiosk-idle__txt">
        觸碰螢幕繼續{" "}
        <span style={{ fontFamily: "var(--serif-en-body)", fontStyle: "italic", color: "var(--ink-mute)" }}>
          Tap to continue
        </span>
      </div>
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <b>{countdown}</b>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-mute)" }}>秒後返回</div>
      </div>
    </motion.div>
  );
}
