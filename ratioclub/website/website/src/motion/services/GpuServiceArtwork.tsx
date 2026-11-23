import { AnimatedServiceArtwork } from "./AnimatedServiceArtwork";
import { gpuArtwork } from "./gpuArtwork";
import type { ServiceArtworkSlot } from "./types";
export default function GpuServiceArtwork(props: ServiceArtworkSlot) {
  return <AnimatedServiceArtwork {...props} artwork={gpuArtwork} />;
}
