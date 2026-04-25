"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STEPS = [
  { phase: "inhale", duration: 4, label: "Breathe In", instruction: "slow and deep" },
  { phase: "hold", duration: 4, label: "Hold", instruction: "stay calm" },
  { phase: "exhale", duration: 6, label: "Breathe Out", instruction: "release tension" },
];

const TOTAL_DURATION = 30;

const PHASE_COLOR = {
  idle: "#a8b5c8",
  inhale: "#7ec8a4",
  hold: "#f0c97a",
  exhale: "#89aadc",
  done: "#a8b5c8",
};

const PHASE_BG = {
  idle: "rgba(168,181,200,0.07)",
  inhale: "rgba(126,200,164,0.09)",
  hold: "rgba(240,201,122,0.09)",
  exhale: "rgba(137,170,220,0.09)",
  done: "rgba(168,181,200,0.07)",
};

function primaryBtn(color, enlarged) {
  return {
    padding: enlarged ? "9px 24px" : "4px 13px",
    fontSize: enlarged ? "12px" : "9px",
    fontWeight: 600,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    background: `${color}16`,
    color,
    border: `1px solid ${color}40`,
    borderRadius: "100px",
    cursor: "pointer",
    transition: "background 0.2s, color 1.4s ease, border-color 1.4s ease",
    fontFamily: "inherit",
    outline: "none",
  };
}

function ghostBtn(enlarged) {
  return {
    padding: enlarged ? "9px 18px" : "4px 10px",
    fontSize: enlarged ? "12px" : "9px",
    fontWeight: 500,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    background: "transparent",
    color: "#3a4558",
    border: "1px solid #1e2838",
    borderRadius: "100px",
    cursor: "pointer",
    fontFamily: "inherit",
    outline: "none",
  };
}

export default function BreathingExercise() {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [enlarged, setEnlarged] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  const cycleDuration = STEPS.reduce((s, x) => s + x.duration, 0); // 14s

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;

    if (elapsed >= TOTAL_DURATION) {
      setIsRunning(false);
      setPhase("done");
      setIsDone(true);
      setTotalProgress(1);
      setStepProgress(1);
      return;
    }

    setTotalProgress(elapsed / TOTAL_DURATION);

    const cyclePos = elapsed % cycleDuration;
    let acc = 0;
    for (let i = 0; i < STEPS.length; i++) {
      if (cyclePos < acc + STEPS[i].duration) {
        setStepIdx(i);
        setPhase(STEPS[i].phase);
        setStepProgress((cyclePos - acc) / STEPS[i].duration);
        break;
      }
      acc += STEPS[i].duration;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [cycleDuration]);

  const start = () => {
    setIsDone(false);
    setPhase("inhale");
    setStepIdx(0);
    setStepProgress(0);
    setTotalProgress(0);
    startTimeRef.current = Date.now();
    setIsRunning(true);
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
    setPhase("idle");
    setStepIdx(0);
    setStepProgress(0);
    setTotalProgress(0);
    startTimeRef.current = null;
    setIsDone(false);
  };

  useEffect(() => {
    if (isRunning) rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isRunning, tick]);

  const color = PHASE_COLOR[phase];
  const bg = PHASE_BG[phase];
  const step = STEPS[stepIdx];

  // orb scale: inhale 0.42→1, hold 1, exhale 1→0.42
  let circleScale = 0.42;
  if (phase === "inhale") circleScale = 0.42 + stepProgress * 0.58;
  else if (phase === "hold") circleScale = 1;
  else if (phase === "exhale") circleScale = 1 - stepProgress * 0.58;

  const secondsLeft = Math.ceil(TOTAL_DURATION - totalProgress * TOTAL_DURATION);

  return (
    <>
      {enlarged && (
        <div
          onClick={() => setEnlarged(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(6,10,16,0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 999,
            cursor: "zoom-out",
          }}
        />
      )}

      <div
        onClick={() => { if (!isRunning && !enlarged) setEnlarged(true); }}
        style={{
          position: enlarged ? "fixed" : "relative",
          ...(enlarged
            ? { top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1000 }
            : {}),
          width: enlarged ? "min(500px, 90vw)" : "100%",
          height: enlarged ? "min(360px, 80vh)" : "100%",
          minHeight: enlarged ? undefined : 0,
          background: "linear-gradient(145deg, #0c1118 0%, #10192a 100%)",
          borderRadius: enlarged ? "20px" : "14px",
          border: `1px solid ${color}28`,
          boxShadow: `0 0 0 1px ${color}14, 0 12px 40px rgba(0,0,0,0.5)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: enlarged ? "18px" : "8px",
          padding: enlarged ? "32px 28px" : "12px",
          overflow: "hidden",
          cursor: isRunning ? "default" : enlarged ? "zoom-out" : "zoom-in",
          transition: "border-color 1.4s ease, box-shadow 1.4s ease",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          userSelect: "none",
          boxSizing: "border-box",
        }}
      >
        {/* ambient glow layer */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: bg,
          transition: "background 1.4s ease",
          borderRadius: "inherit",
        }} />

        {/* progress bar (bottom edge) */}
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          height: "2px",
          width: `${totalProgress * 100}%`,
          background: `linear-gradient(90deg, ${color}44, ${color}99)`,
          transition: "width 0.15s linear, background 1.4s ease",
          borderRadius: "0 2px 0 0",
        }} />

        {/* orb */}
        <div style={{
          position: "relative",
          width: enlarged ? "110px" : "56px",
          height: enlarged ? "110px" : "56px",
          flexShrink: 0,
        }}>
          {/* glow ring */}
          <div style={{
            position: "absolute",
            inset: enlarged ? "-16px" : "-8px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}1a 0%, transparent 70%)`,
            transform: `scale(${0.55 + circleScale * 0.5})`,
            transition: "transform 0.12s linear, background 1.4s ease",
          }} />
          {/* orb body */}
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle at 33% 33%, ${color}dd, ${color}40)`,
            transform: `scale(${circleScale})`,
            boxShadow: `0 0 ${enlarged ? 28 : 14}px ${color}55`,
            transition: "transform 0.12s linear, background 1.4s ease, box-shadow 1.4s ease",
          }} />
          {/* shimmer */}
          <div style={{
            position: "absolute",
            top: "18%", left: "22%",
            width: "28%", height: "16%",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
            transform: `scale(${circleScale})`,
            transition: "transform 0.12s linear",
            filter: "blur(1.5px)",
          }} />
        </div>

        {/* phase text */}
        <div style={{ position: "relative", textAlign: "center", minHeight: enlarged ? "38px" : "22px" }}>
          {phase === "idle" && (
            <p style={{
              margin: 0,
              fontSize: enlarged ? "12px" : "9px",
              color: "#6b7585",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              tap · breathe · relax
            </p>
          )}
          {phase === "done" && (
            <>
              <p style={{
                margin: 0,
                fontSize: enlarged ? "15px" : "10px",
                color: PHASE_COLOR.inhale,
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}>
                ✦ Well done
              </p>
              {enlarged && (
                <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#4a5568", letterSpacing: "0.06em" }}>
                  you made it through 30 seconds
                </p>
              )}
            </>
          )}
          {isRunning && step && (
            <>
              <p style={{
                margin: 0,
                fontSize: enlarged ? "17px" : "10px",
                fontWeight: 700,
                color,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                transition: "color 1.4s ease",
              }}>
                {step.label}
              </p>
              {enlarged && (
                <p style={{
                  margin: "2px 0 0",
                  fontSize: "11px",
                  color: "#4a5568",
                  letterSpacing: "0.06em",
                }}>
                  {step.instruction}
                </p>
              )}
            </>
          )}
        </div>

        {/* controls */}
        <div
          style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}
          onClick={e => e.stopPropagation()}
        >
          {!isRunning && !isDone && (
            <button onClick={start} style={primaryBtn(color, enlarged)}>
              {enlarged ? "Begin · 30s" : "Start"}
            </button>
          )}
          {isDone && (
            <button onClick={start} style={primaryBtn(color, enlarged)}>
              Again
            </button>
          )}
          {isRunning && (
            <>
              <button onClick={stop} style={ghostBtn(enlarged)}>Stop</button>
              <span style={{
                fontSize: enlarged ? "12px" : "9px",
                color: "#313d50",
                fontVariantNumeric: "tabular-nums",
                minWidth: "22px",
                textAlign: "right",
              }}>
                {secondsLeft}s
              </span>
            </>
          )}
          {!isRunning && totalProgress > 0 && !isDone && (
            <button onClick={stop} style={ghostBtn(enlarged)}>Reset</button>
          )}
          {isDone && (
            <button onClick={stop} style={ghostBtn(enlarged)}>Reset</button>
          )}
        </div>

        {/* expand hint */}
        {!enlarged && !isRunning && phase === "idle" && (
          <p style={{
            position: "absolute", bottom: "5px", right: "8px",
            margin: 0, fontSize: "7px", color: "#222c38", letterSpacing: "0.05em",
          }}>
            ↗ expand
          </p>
        )}

        {/* close button in enlarged */}
        {enlarged && (
          <p
            onClick={() => setEnlarged(false)}
            style={{
              position: "absolute", top: "12px", right: "14px",
              margin: 0, fontSize: "11px", color: "#2a3140",
              cursor: "pointer", letterSpacing: "0.04em",
            }}
          >
            ✕
          </p>
        )}
      </div>
    </>
  );
}