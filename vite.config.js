import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createReadStream, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { copyFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const sourceImagesDir = path.join(rootDir, "images");

function rootImagesPlugin() {
  return {
    name: "root-images",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url || "", "http://localhost").pathname;
        if (!pathname.startsWith("/images/")) {
          next();
          return;
        }

        const relativePath = decodeURIComponent(pathname.replace(/^\/images\//, ""));
        const filePath = path.resolve(sourceImagesDir, relativePath);
        if (!filePath.startsWith(`${sourceImagesDir}${path.sep}`) || !existsSync(filePath)) {
          next();
          return;
        }

        if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
          res.setHeader("Content-Type", "image/jpeg");
        }
        createReadStream(filePath).pipe(res);
      });
    },
    async closeBundle() {
      const outImagesDir = path.join(rootDir, "dist", "images");
      if (!existsSync(sourceImagesDir)) return;
      rmSync(outImagesDir, { recursive: true, force: true });
      mkdirSync(outImagesDir, { recursive: true });
      await copyImages(sourceImagesDir, outImagesDir);
    },
  };
}

async function copyImages(fromDir, toDir) {
  const entries = readdirSync(fromDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fromPath = path.join(fromDir, entry.name);
      const toPath = path.join(toDir, entry.name);
      if (entry.isDirectory()) {
        mkdirSync(toPath, { recursive: true });
        await copyImages(fromPath, toPath);
        return;
      }
      if ((await stat(fromPath)).isFile()) {
        await copyFile(fromPath, toPath);
      }
    })
  );
}

export default defineConfig({
  plugins: [react(), rootImagesPlugin()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001"
    }
  }
});
