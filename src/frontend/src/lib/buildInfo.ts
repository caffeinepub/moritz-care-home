/**
 * Build information utility
 * Provides frontend build identifier and version information
 */

// Try to get build-time environment variables
const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString();
const buildVersion = import.meta.env.VITE_BUILD_VERSION || 'dev';
const gitCommit = import.meta.env.VITE_GIT_COMMIT || 'unknown';

export interface BuildInfo {
  version: string;
  timestamp: string;
  commit: string;
  environment: 'production' | 'development' | 'local';
}

export function getBuildInfo(): BuildInfo {
  // Determine environment
  const isDev = import.meta.env.DEV;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  let environment: BuildInfo['environment'] = 'production';
  if (isDev || isLocal) {
    environment = isLocal ? 'local' : 'development';
  }

  return {
    version: buildVersion,
    timestamp: buildTimestamp,
    commit: gitCommit.substring(0, 7), // Short commit hash
    environment,
  };
}

export function getBuildIdentifier(): string {
  const info = getBuildInfo();
  return `v${info.version}-${info.commit}`;
}
