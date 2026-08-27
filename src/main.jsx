import React from "react";
import { createRoot } from "react-dom/client";
import JobLensPanel from "../JobLensPanel.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <JobLensPanel />
  </React.StrictMode>,
);
