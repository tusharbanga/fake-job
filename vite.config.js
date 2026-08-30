import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, mkdirSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-recharge-page",
      closeBundle() {
        mkdirSync("dist/recharge", { recursive: true });
        cpSync("recharge/index.html", "dist/recharge/index.html");
      },
    },
  ],
});
