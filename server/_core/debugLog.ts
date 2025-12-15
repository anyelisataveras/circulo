/**
 * Server-side debug logging helper
 * Only executes in Node.js environment to prevent bundler issues
 * This function is designed to be tree-shaken out of client bundles
 */

// Use a function that checks for Node.js environment at runtime
// This prevents bundlers from including fs module in client bundles
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' 
    && typeof process.versions !== 'undefined' 
    && typeof process.versions.node !== 'undefined'
    && typeof window === 'undefined';
}

export function debugLog(location: string, message: string, data: any, hypothesisId?: string): void {
  // Only execute in Node.js environment - this check prevents bundler from including fs
  if (!isNodeEnvironment()) {
    return;
  }

  try {
    // Use dynamic require to prevent bundler from analyzing this code
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const logPath = '/Users/a/circulo/.cursor/debug.log';
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logEntry = JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: hypothesisId || 'A'
    }) + '\n';
    fs.appendFileSync(logPath, logEntry);
  } catch (e) {
    // Silently fail if logging is not available
  }
}

