import React from "react";
import { createRoot } from "react-dom/client";
import SimulatorContainer from "./components/SimulatorContainer.jsx";

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <SimulatorContainer />
    </React.StrictMode>
  );
} else {
  // eslint-disable-next-line no-console
  console.error("Root element 'root' not found for simulator");
}
