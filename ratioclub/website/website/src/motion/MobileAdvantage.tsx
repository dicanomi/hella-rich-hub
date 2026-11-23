import { AnimatedAdvantageArtwork } from "./AnimatedAdvantageArtwork";
import type { AdvantageMotionMode } from "./AnimatedAdvantageArtwork";
import { mobileArtwork } from "./mobileArtwork";
export default function MobileAdvantage(props: { mode: AdvantageMotionMode; replay?: number }) {
  return <AnimatedAdvantageArtwork {...props} variant="mobile" groups={mobileArtwork} />;
}
