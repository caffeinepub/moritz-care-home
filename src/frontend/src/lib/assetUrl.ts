/**
 * Constructs a base-path-safe URL for public assets.
 * Uses the configured base path from Vite to ensure assets work
 * in both local development and after deployment.
 */
export function getAssetUrl(path: string): string {
  const basePath = import.meta.env.BASE_URL || '/';
  
  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Normalize base path: ensure it ends with slash and doesn't have double slashes
  let cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  
  // Handle edge case where basePath might be just '/'
  if (cleanBase === '//') {
    cleanBase = '/';
  }
  
  // Construct the final URL
  const finalUrl = `${cleanBase}${cleanPath}`;
  
  // Remove any accidental double slashes (except after protocol)
  return finalUrl.replace(/([^:]\/)\/+/g, '$1');
}
