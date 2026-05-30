/**
 * hella.rich — App Router
 * Design: Cinematic Product Lab
 *
 * All products hosted internally — no external hella.rich links.
 * Heavy product pages are lazy-loaded for faster initial bundle.
 *
 * Routes:
 *   /             → Landing (hub)
 *   /the-eye      → THE EYE flagship
 *   /low-battery  → LOW BATTERY
 *   /space-drone  → SPACE DRONE
 *   /aether       → ÆTHER
 *   /orb          → ORB
 *   /dead-air     → DEAD AIR
 *   /fourcast     → FOURCAST
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { Suspense, lazy, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { HellaRichNav } from "./components/HellaRichNav";
import { IntroSplash, shouldShowIntro, markIntroSeen } from "./components/IntroSplash";
import { ThemeProvider } from "./contexts/ThemeContext";

// Critical path — loaded eagerly
import Landing from "./pages/Landing";
import TheEyePage from "./pages/TheEyePage";
import LowBatteryPage from "./pages/LowBatteryPage";
import NotFound from "./pages/NotFound";

// Heavy products — lazy loaded (Tone.js, large CSS, complex canvases)
const SpaceDronePage = lazy(() => import("./pages/SpaceDronePage"));
const AetherPage     = lazy(() => import("./pages/AetherPage"));
const OrbPage        = lazy(() => import("./pages/OrbPage"));
const DeadAirPage    = lazy(() => import("./pages/DeadAirPage"));
const FourcastPage   = lazy(() => import("./pages/FourcastPage"));

// Minimal fallback — dark screen, no spinner (matches hella.rich aesthetic)
function PageFallback() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0a0908',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(8px, 0.85vw, 10px)',
        letterSpacing: '0.22em',
        color: 'rgba(255,255,255,0.18)',
        textTransform: 'uppercase',
      }}>
        loading
      </div>
    </div>
  );
}

function Router() {
  const [introActive, setIntroActive] = useState(() => shouldShowIntro());

  const handleIntroComplete = () => {
    markIntroSeen();
    setIntroActive(false);
  };

  return (
    <>
      {introActive && <IntroSplash onComplete={handleIntroComplete} />}
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/the-eye" component={TheEyePage} />
          <Route path="/low-battery" component={LowBatteryPage} />
          <Route path="/space-drone" component={SpaceDronePage} />
          <Route path="/aether" component={AetherPage} />
          <Route path="/orb" component={OrbPage} />
          <Route path="/dead-air" component={DeadAirPage} />
          <Route path="/fourcast" component={FourcastPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <HellaRichNav />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
