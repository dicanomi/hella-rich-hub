import {useHeroIntro} from "./useHeroIntro";
import {sitePath} from "../config/paths";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { HeroMedia } from "./HeroMedia";
import { indexContent } from "../content/index";
import { BookingAction } from "./BookingAction";
import arrow from "../assets/arrow-right-desktop.svg";
import scrollIndicator from "../assets/hero-scroll-indicator.svg";

export function HeroIndex({ media }: { media?: ReactNode } = {}) {
  const introRoot=useRef<HTMLElement>(null);
  useHeroIntro(introRoot);
  const cancelScroll = useRef<() => void>(() => {});
  useEffect(() => () => cancelScroll.current(), []);
  return (
    <section ref={introRoot} className="hero-index" aria-labelledby="hero-title">
      <div className="hero-surface">
        {media ?? <HeroMedia />}
        <Header />
        <div className="hero-copy">
          <h1 id="hero-title" tabIndex={-1}>
            {indexContent.title}
          </h1>
          <div className="hero-actions">
            <BookingAction label={indexContent.primaryAction} mobileLabel="Schedule Review" />
            <a className="text-action hero-explore" href={sitePath("/solutions")}><span>Explore solutions</span><span className="action-arrow" aria-hidden="true" style={{maskImage:`url("${arrow}")`}} /></a>
          </div>
        </div>
        <a
          className="hero-scroll"
          href="#introduction"
          aria-label="Read about Ratioclub"
          onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const section = document.getElementById("introduction");
            if (!section) return;
            event.preventDefault();
            cancelScroll.current();
            const startY = window.scrollY;
            const startTime = performance.now();
            const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 550;
            let frame = 0;
            const cancel = () => {
              cancelAnimationFrame(frame);
              window.removeEventListener("wheel", cancel);
              window.removeEventListener("touchstart", cancel);
              window.removeEventListener("keydown", cancel);
            };
            cancelScroll.current = cancel;
            const step = (now: number) => {
              const progress = duration ? Math.min(1, (now - startTime) / duration) : 1;
              const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
              const targetY = window.scrollY + section.getBoundingClientRect().top;
              window.scrollTo({ top: startY + (targetY - startY) * eased, behavior: "instant" });
              if (progress < 1) frame = requestAnimationFrame(step);
              else { cancel(); section.focus({ preventScroll: true }); }
            };
            window.addEventListener("wheel", cancel, { passive: true });
            window.addEventListener("touchstart", cancel, { passive: true });
            window.addEventListener("keydown", cancel);
            frame = requestAnimationFrame(step);
            history.replaceState(history.state, "", "#introduction");
          }}
        >
          <img src={scrollIndicator} width="192" height="50" alt="" />
        </a>
      </div>
    </section>
  );
}
