import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "dist",
    },
    server: {
        host: true,
        port: 3000,
    },
    preview: {
        host: "0.0.0.0",
        port: 3000,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
