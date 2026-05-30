/**
 * ÆTHER — Ambient Synthesizer
 * Main Page
 *
 * Design: Scandinavian Instrument Minimalism
 * Philosophy: "Impossible to sound bad"
 */

import "../aether.css";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { MacroSlider } from "../components/aether/MacroSlider";
import { MoodSelector } from "../components/aether/MoodSelector";
import { PresetSelector } from "../components/aether/PresetSelector";
import { Visualizer } from "../components/aether/Visualizer";
import { type MoodName, type PresetName, useAudioEngine } from "../hooks/useAetherAudio";

export default function AetherPage() {
  const {
    isPlaying,
    isLoading,
    params,
    currentPreset,
    moodColor,
    moods,
    presets,
    start,
    stop,
    updateParams,
    loadPreset,
    newWorld,
    getAnalyserData,
    getWaveformData,
  } = useAudioEngine();

  const [showPresets, setShowPresets] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      stop();
    } else {
      setHasStarted(true);
      await start({
        mood: "Dream" as MoodName,
        density: 0.55,
        motion: 0.65,
        dirt: 0.15,
        space: 0.75,
      });
    }
  }, [isPlaying, start, stop]);

  const handleMoodChange = useCallback(
    (mood: MoodName) => {
      updateParams({ mood });
    },
    [updateParams]
  );

  const handlePresetSelect = useCallback(
    (preset: PresetName) => {
      loadPreset(preset);
      setShowPresets(false);
    },
    [loadPreset]
  );

  return (
    <div className="synth-root">
      {/* ── Full-screen visualizer canvas ─────────────────────────────── */}
      <div className="synth-canvas-layer">
        <Visualizer
          getAnalyserData={getAnalyserData}
          getWaveformData={getWaveformData}
          isPlaying={isPlaying}
          moodColor={moodColor}
          className="synth-canvas"
        />
      </div>

      {/* ── Mood color overlay (subtle tint) ──────────────────────────── */}
      <motion.div
        className="synth-mood-overlay"
        animate={{ opacity: isPlaying ? 0.04 : 0.02 }}
        transition={{ duration: 2.5 }}
        style={{ background: moodColor }}
      />

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="synth-header">
        <div className="synth-brand">
          <span className="synth-brand-name">ÆTHER</span>
          <span className="synth-brand-divider">·</span>
          <span className="synth-brand-sub">AMBIENT SYNTHESIZER</span>
        </div>

        <div className="synth-status">
          <motion.div
            className="synth-status-dot"
            animate={{
              opacity: isPlaying ? [0.5, 1, 0.5] : 0.25,
              scale: isPlaying ? [1, 1.3, 1] : 1,
            }}
            transition={{
              duration: 2.5,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
            }}
          />
          <span className="synth-status-text">
            {isLoading ? "LOADING" : isPlaying ? "ENGAGED" : "STANDBY"}
          </span>
        </div>

        <div className="synth-header-right">
          <span className="synth-brand-owner">hella.rich</span>
        </div>
      </header>

      {/* ── Splash / Play screen ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!hasStarted && (
          <motion.div
            className="synth-splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 1.0, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="synth-splash-inner">
              <motion.div
                className="synth-splash-title"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
              >
                <h1 className="synth-splash-heading">ÆTHER</h1>
                <p className="synth-splash-tagline">Impossible to sound bad.</p>
              </motion.div>

              <motion.div
                className="synth-splash-cta"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              >
                <motion.button
                  className="synth-play-btn"
                  onClick={handlePlay}
                  disabled={isLoading}
                  whileTap={{ scale: 0.96 }}
                >
                  {isLoading ? (
                    <span className="synth-play-loading">
                      <span className="synth-loading-dot" />
                      <span className="synth-loading-dot" />
                      <span className="synth-loading-dot" />
                    </span>
                  ) : (
                    <>
                      <span className="synth-play-icon">▶</span>
                      PLAY
                    </>
                  )}
                </motion.button>
              </motion.div>

              <motion.div
                className="synth-splash-meta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.8 }}
              >
                <span className="synth-splash-hint">No music knowledge required</span>
                <span className="synth-splash-sep">·</span>
                <span className="synth-splash-hint">7 emotional worlds</span>
                <span className="synth-splash-sep">·</span>
                <span className="synth-splash-hint">8 moods</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main control panel ────────────────────────────────────────── */}
      <AnimatePresence>
        {hasStarted && (
          <motion.div
            className="synth-panel"
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* ── Mood selector ─────────────────────────────────────── */}
            <MoodSelector
              moods={moods}
              currentMood={params.mood as MoodName}
              onSelect={handleMoodChange}
            />

            {/* ── Divider ───────────────────────────────────────────── */}
            <div className="synth-panel-divider" />

            {/* ── Macro sliders ─────────────────────────────────────── */}
            <div className="synth-sliders">
              <MacroSlider
                label="DENSITY"
                value={params.density}
                onChange={(v) => updateParams({ density: v })}
                description="Minimal drone → dense atmosphere"
              />
              <MacroSlider
                label="MOTION"
                value={params.motion}
                onChange={(v) => updateParams({ motion: v })}
                description="Still → slow modulation → movement"
              />
              <MacroSlider
                label="DIRT"
                value={params.dirt}
                onChange={(v) => updateParams({ dirt: v })}
                description="Clean → tape noise → saturation"
              />
              <MacroSlider
                label="SPACE"
                value={params.space}
                onChange={(v) => updateParams({ space: v })}
                description="Intimate → room → cathedral → cosmos"
              />
            </div>

            {/* ── Bottom action bar ─────────────────────────────────── */}
            <div className="synth-actions">
              {/* Play/Stop */}
              <motion.button
                className={`synth-action-btn synth-action-btn--play ${isPlaying ? "synth-action-btn--playing" : ""}`}
                onClick={handlePlay}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.1 }}
              >
                {isPlaying ? (
                  <>
                    <span className="synth-btn-icon">■</span>
                    STOP
                  </>
                ) : (
                  <>
                    <span className="synth-btn-icon">▶</span>
                    PLAY
                  </>
                )}
              </motion.button>

              {/* Presets */}
              <div className="synth-preset-wrapper">
                <motion.button
                  className="synth-action-btn synth-action-btn--preset"
                  onClick={() => setShowPresets(!showPresets)}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.1 }}
                >
                  <span className="synth-current-preset">{currentPreset}</span>
                  <span className="synth-btn-chevron">{showPresets ? "▲" : "▼"}</span>
                </motion.button>

                <AnimatePresence>
                  {showPresets && (
                    <motion.div
                      className="synth-preset-dropdown"
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <PresetSelector
                        presets={presets}
                        currentPreset={currentPreset}
                        onSelect={handlePresetSelect}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* New World */}
              <motion.button
                className="synth-action-btn synth-action-btn--new-world"
                onClick={newWorld}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.15 }}
                title="Generate a new random world"
              >
                <motion.span
                  className="synth-btn-icon"
                  animate={isPlaying ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  ✦
                </motion.span>
                NEW WORLD
              </motion.button>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Preset label */}
              <div className="synth-world-label">
                <span className="synth-world-label-text">WORLD</span>
                <span className="synth-world-label-name">{currentPreset}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close presets */}
            {showPresets && (
        <div
          className="synth-overlay-dismiss"
          onClick={() => setShowPresets(false)}
        />
      )}
    </div>
  );
}
