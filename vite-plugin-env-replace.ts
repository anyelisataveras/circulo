/**
 * Vite plugin to replace environment variables in HTML
 * Replaces %VITE_*% placeholders in index.html during build
 */
import type { Plugin } from 'vite';

export function vitePluginEnvReplace(): Plugin {
  return {
    name: 'vite-plugin-env-replace',
    transformIndexHtml(html, context) {
      // Get all environment variables that start with VITE_
      const envVars = Object.keys(process.env)
        .filter(key => key.startsWith('VITE_'))
        .reduce((acc, key) => {
          acc[key] = process.env[key] || '';
          return acc;
        }, {} as Record<string, string>);

      // Replace %VITE_*% placeholders in HTML
      let transformedHtml = html;
      for (const [key, value] of Object.entries(envVars)) {
        const placeholder = `%${key}%`;
        transformedHtml = transformedHtml.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          value
        );
      }

      // Remove any remaining %VITE_*% placeholders that weren't replaced
      // (to avoid broken links)
      transformedHtml = transformedHtml.replace(
        /%VITE_[A-Z_]+%/g,
        ''
      );

      return transformedHtml;
    },
  };
}
