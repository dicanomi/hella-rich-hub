import {localMedia} from "../content/local-media";
import { useEffect, useRef, useState } from "react";
import heroVideoFallback from "../assets/hero-review-updated.mp4";
import desktopPosterFallback from "../assets/404-video-frame-desktop.webp";
import mobilePosterFallback from "../assets/404-video-frame-mobile.webp";
import overlay from "../assets/hero-overlay.webp";
import mobileOverlay from "../assets/hero-overlay-mobile.webp";
const heroVideo=localMedia("heroVideo",heroVideoFallback);
const desktopPoster=localMedia("heroPosterDesktop",localMedia("notFoundDesktop",desktopPosterFallback));
const mobilePoster=localMedia("heroPosterMobile",localMedia("notFoundMobile",mobilePosterFallback));

type DataConnection = EventTarget & {
  saveData?: boolean;
  effectiveType?: string;
};
type NavigatorWithConnection = Navigator & { connection?: DataConnection };

function prefersStillImage() {
  if (typeof navigator === "undefined" || typeof matchMedia === "undefined") return true;
  const connection = (navigator as NavigatorWithConnection).connection;
  return matchMedia("(prefers-reduced-motion: reduce)").matches ||
    matchMedia("(prefers-reduced-data: reduce)").matches ||
    Boolean(connection?.saveData) || ["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
}

export function HeroMedia() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const playbackWanted = useRef(true);
  const playbackRequested = useRef(false);
  const synchronizePlayback = useRef<() => void>(() => {});
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPoster, setShowPoster] = useState(prefersStillImage);
  const [source, setSource] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia('(max-width:768px), (hover:none)');
    const dataPreference = window.matchMedia("(prefers-reduced-data: reduce)");
    const connection = (navigator as NavigatorWithConnection).connection;
    const updatePreferences = () => {
      const conserveData =
        dataPreference.matches ||
        connection?.saveData ||
        connection?.effectiveType === "slow-2g" ||
        connection?.effectiveType === "2g";
      setShowPoster(Boolean(motion.matches || conserveData));
      if (motion.matches || conserveData) {
        videoRef.current?.pause();
        setSource(undefined);
        setHasFrame(false);
        setIsPlaying(false);
      } else if(!compact.matches||playbackRequested.current) {
        setShowPoster(false);setSource(heroVideo);
      } else {
        videoRef.current?.pause();setShowPoster(true);setSource(undefined);setHasFrame(false);setIsPlaying(false);
      }
    };
    updatePreferences();
    compact.addEventListener("change",updatePreferences);
    motion.addEventListener("change", updatePreferences);
    dataPreference.addEventListener("change", updatePreferences);
    connection?.addEventListener("change", updatePreferences);
    return () => {
      compact.removeEventListener("change",updatePreferences);
      motion.removeEventListener("change", updatePreferences);
      dataPreference.removeEventListener("change", updatePreferences);
      connection?.removeEventListener("change", updatePreferences);
    };
  }, []);

  useEffect(() => {
    if (!source) return;
    const video = videoRef.current;
    const media = mediaRef.current;
    if (!video || !media) return;
    let disposed = false;
    const bounds = media.getBoundingClientRect();
    let inViewport = bounds.bottom > 0 && bounds.top < window.innerHeight;
    const synchronize = () => {
      if (!disposed && inViewport && !document.hidden && playbackWanted.current) {
        void video.play().catch(() => { if (!disposed) {setIsPlaying(false);setSource(undefined);setHasFrame(false);setShowPoster(true);} });
      } else video.pause();
    };
    synchronizePlayback.current = synchronize;
    const observer = new IntersectionObserver(entries => {
      inViewport = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.05);
      synchronize();
    }, { threshold: [0, 0.05] });
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      video.currentTime = 0;
      playbackWanted.current = true;
      synchronize();
    };
    observer.observe(media);
    document.addEventListener("visibilitychange", synchronize);
    window.addEventListener("pageshow", restore);
    synchronize();
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      window.removeEventListener("pageshow", restore);
      video.pause();
      synchronizePlayback.current = () => {};
    };
  }, [source]);

  function togglePlayback() {
    const video = videoRef.current;
    playbackRequested.current=true;
    if (!source) {
      playbackWanted.current = true;
      setShowPoster(false);
      setSource(heroVideo);
      return;
    }
    playbackWanted.current = video?.paused ?? true;
    synchronizePlayback.current();
  }

  return (
    <>
      <div className="hero-media" ref={mediaRef} aria-hidden="true">
        {showPoster || failed || !hasFrame ? <div className="hero-poster"><div className="hero-video-frames"><picture className="hero-poster-image">
          <source media="(max-width: 48rem)" srcSet={mobilePoster} />
          <img
            src={desktopPoster}
            alt=""
            width="1024"
            height="768"
            fetchPriority="high"
          />
        </picture>
          <picture className="hero-overlay"><source media="(max-width:48rem)" srcSet={mobileOverlay}/><img src={overlay} alt=""/></picture>
          <div className="hero-desaturate"/><div className="hero-progressive-blur"/>
        </div></div> : null}
        {source ? (
          <div
            className={`hero-motion${hasFrame ? " hero-motion--visible" : ""}`}
          >
            <div className="hero-video-frames">
            <video
              ref={videoRef}
              src={source}
              muted
              loop
              playsInline
              preload="none"
              onPlaying={() => {
                setIsPlaying(true);
                setHasFrame(true);
              }}
              onPause={() => setIsPlaying(false)}
              onError={() => {
                setFailed(true);
                setHasFrame(false);
                setIsPlaying(false);
              }}
              tabIndex={-1}
              disablePictureInPicture
            />
            <picture className="hero-overlay">
              <source media="(max-width: 48rem)" srcSet={mobileOverlay} />
              <img src={overlay} alt="" />
            </picture>
            <div className="hero-desaturate" />
            <div className="hero-progressive-blur" />
            </div>
          </div>
        ) : null}
      </div>
      {!failed ? (
        <button
          type="button"
          className="media-toggle"
          onClick={() => void togglePlayback()}
          aria-label={
            isPlaying ? "Pause background video" : "Play background video"
          }
        >
          <span
            className={isPlaying ? "pause-icon" : "play-icon"}
            aria-hidden="true"
          />
        </button>
      ) : (
        <span className="sr-only" role="status">
          Background video unavailable. A still image is displayed.
        </span>
      )}
    </>
  );
}
