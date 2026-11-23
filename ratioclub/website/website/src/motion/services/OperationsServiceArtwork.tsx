import { AnimatedServiceArtwork } from "./AnimatedServiceArtwork";
import { operationsArtwork } from "./operationsArtwork";
import type { ServiceArtworkSlot } from "./types";
export default function OperationsServiceArtwork(props: ServiceArtworkSlot) {
  return <AnimatedServiceArtwork {...props} artwork={operationsArtwork} />;
}
