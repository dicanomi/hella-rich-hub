import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Remove the static boot overlay (#hr-boot, the "> SYSTEM MESSAGE" screen) once
// React has mounted. The CSS rule `#root:not(:empty) ~ #hr-boot { display:none }`
// in index.html relies on WebKit re-evaluating a :not(:empty) sibling selector
// after the DOM changes, which iOS Safari does NOT do reliably — leaving the
// boot screen stuck on top of the loaded app on every iOS browser. Removing it
// imperatively does not depend on that invalidation and works everywhere.
requestAnimationFrame(() => {
  document.getElementById("hr-boot")?.remove();
});
