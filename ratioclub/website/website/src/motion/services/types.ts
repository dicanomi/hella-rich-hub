import type { SVGProps } from "react";
export type ServiceVariant = "gpu" | "inference" | "operations";
export type ServicePlane = "upper" | "middle" | "lower";
export type ServiceArtwork = {
  variant: ServiceVariant;
  width: number;
  height: number;
  viewBox: string;
  shift: [number, number];
  groups: {
    plane: ServicePlane | "connector";
    paths: { index: number; attrs: SVGProps<SVGPathElement>; label: boolean; reveal: boolean; signal: boolean }[];
  }[];
  connectors: { index: number; y: number; height: number; fromPlane: ServicePlane; toPlane: ServicePlane }[];
};
export type ServiceArtworkSlot = { slotWidth: number; slotHeight: number };
