import { AnimatedServiceArtwork } from "./AnimatedServiceArtwork";
import { inferenceArtwork } from "./inferenceArtwork";
import type { ServiceArtworkSlot } from "./types";
export default function InferenceServiceArtwork(props: ServiceArtworkSlot) {
  return <AnimatedServiceArtwork {...props} artwork={inferenceArtwork} />;
}
