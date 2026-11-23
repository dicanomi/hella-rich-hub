import { AnimatedAdvantageArtwork } from "./AnimatedAdvantageArtwork";
import type { AdvantageMotionMode } from "./AnimatedAdvantageArtwork";
import { desktopArtwork } from "./desktopArtwork";
export default function DesktopAdvantage(props: { mode: AdvantageMotionMode; replay?: number }) {
  return <AnimatedAdvantageArtwork {...props} variant="desktop" groups={desktopArtwork} />;
}
