/**
 * hella.rich — App Router
 * Design: Cinematic Product Lab
 *
 * All products hosted internally. Heavy product pages are lazy-loaded.
 * Router base is import.meta.env.BASE_URL: "/" on live (hella.rich),
 * "/hella-rich-hub/" on the GitHub Pages staging build.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";
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

// Heavy products — lazy loaded
const SpaceDronePage = lazy(() => import("./pages/SpaceDronePage"));
const AetherPage     = lazy(() => import("./pages/AetherPage"));
const OrbPage        = lazy(() => import("./pages/OrbPage"));
const DeadAirPage    = lazy(() => import("./pages/DeadAirPage"));
const FourcastPage   = lazy(() => import("./pages/FourcastPage"));
const RadioPage      = lazy(() => import("./pages/RadioPage"));
const HumanExePage   = lazy(() => import("./pages/HumanExePage"));

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

// wouter's base must not have a trailing slash; BASE_URL has one (e.g. "/hella-rich-hub/").
const ROUTER_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function AppRoutes() {
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
          <Route path="/radio" component={RadioPage} />
          <Route path="/human-exe" component={HumanExePage} />
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
          <WouterRouter base={ROUTER_BASE}>
            <HellaRichNav />
            <AppRoutes />
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
