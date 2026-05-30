/**
 * PresetSelector — Emotional preset pills
 * Design: Scandinavian Instrument Minimalism
 */

import { motion } from "framer-motion";
import type { PresetName } from "../../hooks/useAetherAudio";

interface PresetSelectorProps {
  presets: PresetName[];
  currentPreset: PresetName;
  onSelect: (preset: PresetName) => void;
}

export function PresetSelector({ presets, currentPreset, onSelect }: PresetSelectorProps) {
  return (
    <div className="preset-selector">
      <div className="preset-label">WORLD</div>
      <div className="preset-list">
        {presets.map((preset) => (
          <motion.button
            key={preset}
            className={`preset-item ${preset === currentPreset ? "preset-item--active" : ""}`}
            onClick={() => onSelect(preset)}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.1 }}
          >
            {preset}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
