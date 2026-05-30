/**
 * MoodSelector — Premium hardware-style pill buttons
 * Design: Scandinavian Instrument Minimalism
 * Feels like pressing physical keys on a Teenage Engineering device
 */

import { motion } from "framer-motion";
import type { MoodName } from "../../hooks/useAetherAudio";

interface MoodSelectorProps {
  moods: MoodName[];
  currentMood: MoodName;
  onSelect: (mood: MoodName) => void;
}

const MOOD_DESCRIPTIONS: Record<MoodName, string> = {
  Warm: "Sunlight through curtains",
  Dark: "Storm approaching",
  Dream: "Half-sleep, floating",
  Space: "Deep cosmos",
  Ritual: "Stone chambers",
  Industrial: "Engine rooms",
  Ocean: "Deep water",
  Tension: "Thriller score",
};

export function MoodSelector({ moods, currentMood, onSelect }: MoodSelectorProps) {
  return (
    <div className="mood-selector">
      <div className="mood-label-row">
        <span className="mood-section-label">MOOD</span>
        <span className="mood-description">{MOOD_DESCRIPTIONS[currentMood]}</span>
      </div>

      <div className="mood-grid">
        {moods.map((mood) => (
          <motion.button
            key={mood}
            className={`mood-pill ${mood === currentMood ? "mood-pill--active" : ""}`}
            onClick={() => onSelect(mood)}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
            aria-pressed={mood === currentMood}
          >
            {mood}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
