import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function BootLayerRemover() {
  // Run only after React has committed the application tree. This preserves the
  // WebKit overlay workaround without exposing a blank document while the app
  // module is delayed or fails before it can render.
  useEffect(() => {
    document.getElementById("hr-boot")?.remove();
  }, []);

  return null;
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("The application root is missing.");
}

createRoot(root).render(
  <>
    <BootLayerRemover />
    <App />
  </>
);
