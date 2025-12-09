/**
 * Vercel Serverless Function Handler
 *
 * This file exports the Express app as a serverless function for Vercel
 */
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";
import path from "path";
const app = express();
// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// tRPC API
app.use("/api/trpc", createExpressMiddleware({
    router: appRouter,
    createContext,
}));
// Serve static files in production (Vercel always runs in production mode)
// The static files are in dist/public after build
const distPath = path.resolve(process.cwd(), "dist", "public");
// Serve static files
app.use(express.static(distPath));
// SPA fallback - serve index.html for all non-API routes
app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) {
        return next();
    }
    // Serve index.html for SPA routing
    const indexPath = path.join(distPath, "index.html");
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Error serving index.html:", err);
            res.status(404).json({ error: "Not found", path: req.path });
        }
    });
});
// Export the app as the default handler for Vercel
export default app;
