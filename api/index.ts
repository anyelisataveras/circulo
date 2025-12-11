/**
 * Vercel Serverless Function Handler
 * 
 * This file exports the Express app as a serverless function for Vercel
 */

import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../dist/server/routers.js";
import { createContext } from "../dist/server/_core/context.js";
import { serveStatic } from "../dist/server/_core/vite.js";
import path from "path";
import fs from "fs";

const app = express();

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files in production (Vercel always runs in production mode)
// The static files are in dist/public after build
const distPath = path.resolve(process.cwd(), "dist", "public");

// Serve static files with proper MIME types
app.use(express.static(distPath, {
  maxAge: "1y",
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set proper MIME types for JavaScript modules
    if (filePath.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    }
  }
}));

// SPA fallback - serve index.html for all non-API routes that don't match static files
app.get("*", (req, res, next) => {
  // Skip API routes - let them be handled by the API router
  if (req.path.startsWith("/api/")) {
    return next();
  }
  
  // Check if it's a static asset request (already handled by express.static above)
  const staticFile = path.join(distPath, req.path);
  try {
    if (fs.existsSync(staticFile) && fs.statSync(staticFile).isFile()) {
      // File exists, express.static should have served it, but if we're here, serve it manually
      return res.sendFile(path.resolve(staticFile));
    }
  } catch (err) {
    // File doesn't exist or error checking, continue to SPA fallback
  }
  
  // For all other routes (SPA routes), serve index.html
  const indexPath = path.join(distPath, "index.html");
  try {
    if (fs.existsSync(indexPath)) {
      return res.sendFile(path.resolve(indexPath));
    }
  } catch (err) {
    // index.html doesn't exist
  }
  
  // If index.html doesn't exist, return 404
  res.status(404).json({ error: "Not found", path: req.path });
});

// Export the app as the default handler for Vercel
export default app;

