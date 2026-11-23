import {flushSync} from "react-dom";
import {restoreScrollPosition,scrollForNavigation} from "./scroll-restoration";
import {routePath} from "./config/paths";
import { applyPageMetadata } from "./content/apply-metadata";
import { lazy, Suspense, useLayoutEffect, useSyncExternalStore } from "react";
import { ForwardDeployedAdvantage } from "./components/ForwardDeployedAdvantage";
import { Quote, MediaDivider } from "./components/Quote";
import { ScaleSpeedEfficiency } from "./components/ScaleSpeedEfficiency";
import { CoreSolutions } from "./components/CoreSolutions";
import { ConversionBanner } from "./components/ConversionBanner";
import { Footer } from "./components/Footer";
import { HeroIndex } from "./components/HeroIndex";
import { Introduction } from "./components/Introduction";
import ContactPage from "./pages/ContactPage";
import LegalPage from "./pages/LegalPage";
import NotFoundPage from "./pages/NotFoundPage";

import SolutionsPage from "./pages/SolutionsPage";
import AboutPage from "./pages/AboutPage";
import {ContactModal} from './components/ContactModal';
const HeroOptionsReview = import.meta.env.VITE_ENABLE_REVIEWS === "true" ? lazy(() => import("./review/HeroOptionsReview")) : null;
const HeroParticleReview = import.meta.env.VITE_ENABLE_REVIEWS === "true" ? lazy(() => import("./review/HeroParticleReview")) : null;
const HeroImageReview = import.meta.env.VITE_ENABLE_REVIEWS === "true" ? lazy(() => import("./review/HeroImageReview")) : null;
const AboutWireframeReview = import.meta.env.VITE_ENABLE_REVIEWS === "true" ? lazy(() => import("./review/AboutWireframeReview")) : null;
const GraphReview = import.meta.env.VITE_ENABLE_REVIEWS === "true" ? lazy(() => import("./review/GraphReview")) : null;
const WireframeReview = import.meta.env.VITE_ENABLE_REVIEWS === "true" ? lazy(() => import("./review/WireframeReview")) : null;
const SacredMorphReview = import.meta.env.VITE_ENABLE_REVIEWS === "true" ? lazy(() => import("./review/SacredMorphReview")) : null;
const MotionReview = import.meta.env.VITE_ENABLE_REVIEWS === "true" ? lazy(() => import("./review/MotionReview")) : null;

const subscribeLocation = (callback: () => void) => {
  const historyNavigation=()=>{flushSync(callback);restoreScrollPosition();};
  const linkNavigation=()=>{flushSync(callback);scrollForNavigation();};
  window.addEventListener("popstate",historyNavigation);
  window.addEventListener("ratioclub:navigate",linkNavigation);
  return ()=>{
    window.removeEventListener("popstate",historyNavigation);
    window.removeEventListener("ratioclub:navigate",linkNavigation);
  };
};
const currentPath = () => routePath(window.location.pathname);
export default function App() {
  const path = useSyncExternalStore(subscribeLocation, currentPath);
  useLayoutEffect(() => { applyPageMetadata(path); }, [path]);
  return <><PageContent key={path} path={path} /><ContactModal key={'contact'+path}/></>;
}
export function PageContent({path}: {path:string}) {
  if (path === "/hero-options" && HeroOptionsReview) return <Suspense fallback={<main className="pending-page">Loading hero options…</main>}><HeroOptionsReview /></Suspense>;
  if (path === "/hero-particle-review" && HeroParticleReview) return <Suspense fallback={<main className="pending-page">Loading particle review…</main>}><HeroParticleReview /></Suspense>;
  if (path === "/hero-image-review" && HeroImageReview) return <Suspense fallback={<main className="pending-page">Loading hero review…</main>}><HeroImageReview /></Suspense>;
  if (path === "/about-wireframe-review" && AboutWireframeReview) return <Suspense fallback={<main className="pending-page">Loading 3D review…</main>}><AboutWireframeReview /></Suspense>;
  if (path === "/sacred-morph-review" && SacredMorphReview) return <Suspense fallback={<main className="pending-page">Loading shape study…</main>}><SacredMorphReview /></Suspense>;
  if (path === "/motion-review" && MotionReview) return <Suspense fallback={<main className="pending-page">Loading motion review…</main>}><MotionReview /></Suspense>;
  if (path === "/wireframe-review" && WireframeReview) return <Suspense fallback={<main className="pending-page">Loading wireframe review…</main>}><WireframeReview /></Suspense>;
  if (path === "/graph-review" && GraphReview) return <Suspense fallback={<main className="pending-page">Loading graph review…</main>}><GraphReview /></Suspense>;
  if (path === "/contact") return <ContactPage/>;
  if (path === "/solutions") return <SolutionsPage />;
  if (path === "/about") return <AboutPage />;
  if (path === "/terms-and-conditions") return <LegalPage document="terms"/>;
  if (path === "/privacy-notice") return <LegalPage document="privacy"/>;
  if (path !== "/") return <NotFoundPage/>;
  return (
    <>
      <a className="skip-link" href="#hero-title">
        Skip to main content
      </a>
      <main>
        <HeroIndex />
        <Introduction />
        <ForwardDeployedAdvantage />
        <Quote reveal />
        <MediaDivider />
        <ScaleSpeedEfficiency />
        <CoreSolutions />
        <ConversionBanner />
      </main>
      <Footer connected />
    </>
  );
}
