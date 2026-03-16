/**
 * Build information utility.
 * Reads build metadata injected at build time via Vite define blocks.
 * Returns null/undefined for values when metadata is not available (e.g., local dev without injection).
 */

export interface BuildInfo {
  buildId: string | null;
  buildTime: string | null;
  gitCommit: string | null;
  hasMetadata: boolean;
}

declare const __BUILD_ID__: string | undefined;
declare const __BUILD_TIME__: string | undefined;
declare const __GIT_COMMIT__: string | undefined;

export function getBuildInfo(): BuildInfo {
  let buildId: string | null = null;
  let buildTime: string | null = null;
  let gitCommit: string | null = null;

  try {
    // These are injected by Vite's define block at build time
    if (
      typeof __BUILD_ID__ !== "undefined" &&
      __BUILD_ID__ &&
      __BUILD_ID__ !== "undefined"
    ) {
      buildId = __BUILD_ID__;
    }
  } catch {
    // Not defined
  }

  try {
    if (
      typeof __BUILD_TIME__ !== "undefined" &&
      __BUILD_TIME__ &&
      __BUILD_TIME__ !== "undefined"
    ) {
      buildTime = __BUILD_TIME__;
    }
  } catch {
    // Not defined
  }

  try {
    if (
      typeof __GIT_COMMIT__ !== "undefined" &&
      __GIT_COMMIT__ &&
      __GIT_COMMIT__ !== "undefined"
    ) {
      gitCommit = __GIT_COMMIT__;
    }
  } catch {
    // Not defined
  }

  const hasMetadata = !!(buildId || buildTime || gitCommit);

  return {
    buildId,
    buildTime,
    gitCommit,
    hasMetadata,
  };
}
