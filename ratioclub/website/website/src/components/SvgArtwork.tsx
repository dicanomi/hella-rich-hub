import type { CSSProperties } from "react";

// Keep the export's root dimensions; scale the unchanged artwork within its slot.
export function SvgArtwork({
  src,
  width,
  height,
  className = "",
}: {
  src: string;
  width: number;
  height: number;
  className?: string;
}) {
  const style = {
    aspectRatio: `${width} / ${height}`,
    "--artwork-width": `${width}px`,
  } as CSSProperties;
  return (
    <div
      className={`svg-artwork ${className}`}
      style={style}
      aria-hidden="true"
    >
      <img
        src={src}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        alt=""
      />
    </div>
  );
}
