/**
 * Startup diagnostics utilities.
 * Provides health check and backend target information for the startup flow.
 */

import { createActorWithConfig } from "../config";

export type HealthCheckStatus = "pending" | "passed" | "failed" | "timed-out";

export interface BackendDiagnostics {
  canisterId: string;
  host: string;
  environment: string;
}

export interface HealthCheckResult {
  status: HealthCheckStatus;
  message: string;
  timestamp?: number;
  durationMs?: number;
  success: boolean;
}

/**
 * Extract backend diagnostics from environment variables.
 * Reads VITE_CANISTER_ID_BACKEND (injected by the Vite build from frontend/.env)
 * with fallbacks for other common naming conventions.
 */
export function getBackendDiagnostics(): BackendDiagnostics {
  // Primary: VITE_CANISTER_ID_BACKEND written by deployment scripts to frontend/.env
  const canisterId =
    (import.meta.env.VITE_CANISTER_ID_BACKEND as string | undefined) ||
    (import.meta.env.VITE_BACKEND_CANISTER_ID as string | undefined) ||
    (import.meta.env.CANISTER_ID_BACKEND as string | undefined) ||
    (import.meta.env.BACKEND_CANISTER_ID as string | undefined) ||
    null;

  // Try various env var names for network/host
  const dfxNetwork =
    (import.meta.env.VITE_DFX_NETWORK as string | undefined) ||
    (import.meta.env.DFX_NETWORK as string | undefined) ||
    (import.meta.env.VITE_NETWORK as string | undefined) ||
    null;

  const host =
    (import.meta.env.VITE_HOST as string | undefined) ||
    (import.meta.env.VITE_IC_HOST as string | undefined) ||
    (import.meta.env.IC_HOST as string | undefined) ||
    null;

  // Derive host from network if not explicitly set
  let resolvedHost: string;
  if (host) {
    resolvedHost = host;
  } else if (dfxNetwork === "ic" || dfxNetwork === "mainnet") {
    resolvedHost = "https://ic0.app";
  } else if (dfxNetwork === "local") {
    resolvedHost = "http://localhost:4943";
  } else if (dfxNetwork) {
    resolvedHost = `https://${dfxNetwork}.ic0.app`;
  } else {
    // Try to infer from current location
    const loc = window.location.hostname;
    if (loc === "localhost" || loc === "127.0.0.1") {
      resolvedHost = "http://localhost:4943";
    } else {
      resolvedHost = "https://ic0.app";
    }
  }

  const environment =
    dfxNetwork || (resolvedHost.includes("localhost") ? "local" : "ic");

  return {
    canisterId: canisterId || "Not configured",
    host: resolvedHost,
    environment,
  };
}

/**
 * Alias for getBackendDiagnostics — returns canisterId and host only.
 * Used by deployment-aware components that only need the two core values.
 */
export function getBackendEnvInfo(): { canisterId: string; host: string } {
  const { canisterId, host } = getBackendDiagnostics();
  return { canisterId, host };
}

/**
 * Perform a health check against the backend canister.
 * Creates an anonymous actor internally — no authentication required.
 * Returns a HealthCheckResult with status, message, and timing information.
 * Uses a short timeout (5s) since healthCheck is a query call on IC.
 */
export async function performHealthCheck(
  timeoutMs = 5000,
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Create an anonymous actor for the health check
    const actor = await Promise.race([
      createActorWithConfig(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Actor creation timed out")),
          timeoutMs,
        ),
      ),
    ]);

    const result = await Promise.race([
      (actor as any).healthCheck(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Health check call timed out")),
          timeoutMs,
        ),
      ),
    ]);

    const durationMs = Date.now() - startTime;

    return {
      status: "passed",
      success: true,
      message: result?.message ?? "Backend is reachable",
      timestamp: result?.timestamp ? Number(result.timestamp) : undefined,
      durationMs,
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const rawMessage = err instanceof Error ? err.message : String(err);

    if (rawMessage.includes("timed out") || rawMessage.includes("timeout")) {
      return {
        status: "timed-out",
        success: false,
        message: "Health check timed out",
        durationMs,
      };
    }

    if (
      rawMessage.includes("is stopped") ||
      rawMessage.includes("canister is stopped")
    ) {
      return {
        status: "failed",
        success: false,
        message: "Backend canister is stopped",
        durationMs,
      };
    }

    if (
      rawMessage.includes("not found") ||
      rawMessage.includes("does not exist") ||
      rawMessage.includes("IC0301")
    ) {
      return {
        status: "failed",
        success: false,
        message: "Backend canister not found or not deployed",
        durationMs,
      };
    }

    if (
      rawMessage.includes("fetch") ||
      rawMessage.includes("network") ||
      rawMessage.includes("NetworkError")
    ) {
      return {
        status: "failed",
        success: false,
        message: "Network error: Unable to reach backend",
        durationMs,
      };
    }

    return {
      status: "failed",
      success: false,
      message: `Health check failed: ${rawMessage}`,
      durationMs,
    };
  }
}
