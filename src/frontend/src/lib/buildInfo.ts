/**
 * Build information utility with runtime fallback for missing environment metadata
 * Provides frontend build identifier and version information
 */

// Try to get build-time environment variables
const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP;
const buildVersion = import.meta.env.VITE_BUILD_VERSION;
const gitCommit = import.meta.env.VITE_GIT_COMMIT;

export interface BuildInfo {
  version: string | null;
  timestamp: string | null;
  commit: string | null;
  environment: 'production' | 'development' | 'local';
  hasMetadata: boolean;
}

interface BuildMetaFile {
  version?: string;
  commit?: string;
  timestamp?: string;
}

let cachedBuildMeta: BuildMetaFile | null | 'loading' = null;

/**
 * Fetch build metadata from runtime file as fallback
 */
async function fetchBuildMetaFile(): Promise<BuildMetaFile | null> {
  if (cachedBuildMeta === 'loading') {
    // Already fetching, wait a bit and return null
    return null;
  }
  
  if (cachedBuildMeta !== null) {
    return cachedBuildMeta;
  }

  cachedBuildMeta = 'loading';
  
  try {
    const response = await fetch('/build-meta.json');
    if (response.ok) {
      const data = await response.json();
      cachedBuildMeta = data;
      return data;
    }
  } catch (error) {
    // Fallback file not available
    console.debug('Build metadata file not available:', error);
  }
  
  cachedBuildMeta = null;
  return null;
}

export function getBuildInfo(): BuildInfo {
  // Determine environment
  const isDev = import.meta.env.DEV;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  let environment: BuildInfo['environment'] = 'production';
  if (isDev || isLocal) {
    environment = isLocal ? 'local' : 'development';
  }

  // Check if we have actual build metadata (not just defaults)
  const hasVersion = buildVersion && buildVersion !== 'dev' && buildVersion !== '';
  const hasCommit = gitCommit && gitCommit !== 'unknown' && gitCommit !== '';
  const hasTimestamp = buildTimestamp && buildTimestamp !== '';
  
  // In production, we should have all metadata
  const hasMetadata = environment === 'production' 
    ? (hasVersion && hasCommit && hasTimestamp)
    : true; // In dev/local, missing metadata is expected

  return {
    version: hasVersion ? buildVersion : null,
    timestamp: hasTimestamp ? buildTimestamp : null,
    commit: hasCommit ? gitCommit?.substring(0, 7) : null, // Short commit hash
    environment,
    hasMetadata,
  };
}

export function getBuildIdentifier(): string | null {
  const info = getBuildInfo();
  
  // In production, if we don't have metadata, return null to signal missing build info
  if (info.environment === 'production' && !info.hasMetadata) {
    return null;
  }
  
  // In development/local, use fallback values
  if (info.environment !== 'production') {
    const version = info.version || 'dev';
    const commit = info.commit || 'unknown';
    return `v${version}-${commit}`;
  }
  
  // Production with metadata
  if (info.version && info.commit) {
    return `v${info.version}-${info.commit}`;
  }
  
  return null;
}

/**
 * Async version that attempts to load from runtime file if env vars are missing
 */
export async function getBuildIdentifierWithFallback(): Promise<string | null> {
  const info = getBuildInfo();
  
  // If we already have metadata from env vars, use it
  if (info.hasMetadata && info.version && info.commit) {
    return `v${info.version}-${info.commit}`;
  }
  
  // In production, try to load from runtime file
  if (info.environment === 'production') {
    const metaFile = await fetchBuildMetaFile();
    if (metaFile && metaFile.version && metaFile.commit) {
      const shortCommit = metaFile.commit.substring(0, 7);
      return `v${metaFile.version}-${shortCommit}`;
    }
    // Still no metadata available
    return null;
  }
  
  // Development/local fallback
  const version = info.version || 'dev';
  const commit = info.commit || 'unknown';
  return `v${version}-${commit}`;
}

export function isBuildMetadataMissing(): boolean {
  const info = getBuildInfo();
  return info.environment === 'production' && !info.hasMetadata;
}
