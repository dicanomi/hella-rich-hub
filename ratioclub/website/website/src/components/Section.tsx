import type { CSSProperties, ReactNode } from "react";

export type SectionSpacing = CSSProperties & {
  "--section-padding-top"?: string;
  "--section-padding-bottom"?: string;
};

export function Section({
  id,
  className = "",
  spacing,
  children,
  label,
}: {
  id: string;
  className?: string;
  spacing?: SectionSpacing;
  children: ReactNode;
  label: string;
}) {
  return (
    <section
      id={id}
      className={`content-section ${className}`}
      style={spacing}
      aria-labelledby={label}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
}: {
  id: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
    </div>
  );
}
