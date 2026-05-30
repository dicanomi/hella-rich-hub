/**
 * hella.rich — App Router
 * Design: Cinematic Product Lab
 *
 * All products hosted internally on Manus — no external hella.rich links.
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
import ErrorBoundary from "./components/ErrorBoundary";
import { HellaRichNav } from "./components/HellaRichNav";
import { IntroSplash, shouldShowIntro, markIntroSeen } from "./components/IntroSplash";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useState } from "react";
import Landing from "./pages/Landing";
import TheEyePage from "./pages/TheEyePage";
import LowBatteryPage from "./pages/LowBatteryPage";
import SpaceDronePage from "./pages/SpaceDronePage";
import AetherPage from "./pages/AetherPage";
import OrbPage from "./pages/OrbPage";
import DeadAirPage from "./pages/DeadAirPage";
import FourcastPage from "./pages/FourcastPage";
import NotFound from "./pages/NotFound";

function Router() {
  const [introActive, setIntroActive] = useState(() => shouldShowIntro());

  const handleIntroComplete = () => {
    markIntroSeen();
    setIntroActive(false);
  };

  return (
    <>
      {introActive && <IntroSplash onComplete={handleIntroComplete} />}
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
