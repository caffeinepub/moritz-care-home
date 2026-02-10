/**
 * Startup diagnostics utilities for troubleshooting backend connection issues
 */

import { createActorWithConfig } from '../config';

export interface BackendDiagnostics {
  canisterId: string;
  network: string;
  host: string;
}

export interface HealthCheckResult {
  success: boolean;
  message: string;
  timestamp?: number;
  status?: 'pending' | 'passed' | 'failed' | 'timed-out';
}

/**
 * Derives backend target information from the frontend configuration
 * Never includes secrets like admin tokens
 * @returns Backend diagnostics information with explicit fallback labels
 */
export function getBackendDiagnostics(): BackendDiagnostics {
  const diagnostics: BackendDiagnostics = {
    canisterId: 'Unknown (configuration missing)',
    network: 'Unknown (configuration missing)',
    host: 'Unknown (configuration missing)',
  };

  try {
    // Try to extract canister ID from environment or config
    const envJson = (window as any).__ENV__;
    if (envJson && typeof envJson === 'object') {
      if (envJson.BACKEND_CANISTER_ID && typeof envJson.BACKEND_CANISTER_ID === 'string') {
        diagnostics.canisterId = envJson.BACKEND_CANISTER_ID;
      }
      if (envJson.DFX_NETWORK && typeof envJson.DFX_NETWORK === 'string') {
        diagnostics.network = envJson.DFX_NETWORK;
      }
      if (envJson.IC_HOST && typeof envJson.IC_HOST === 'string') {
        // Sanitize host to remove any query parameters or secrets
        try {
          const url = new URL(envJson.IC_HOST);
          diagnostics.host = `${url.protocol}//${url.host}${url.pathname}`.replace(/\/$/, '');
        } catch {
          // If URL parsing fails, just use the host as-is but sanitize
          diagnostics.host = envJson.IC_HOST.split('?')[0];
        }
      }
    }

    // Fallback: try to detect from window location
    if (diagnostics.network === 'Unknown (configuration missing)') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        diagnostics.network = 'local (detected from hostname)';
        if (diagnostics.host === 'Unknown (configuration missing)') {
          diagnostics.host = 'http://localhost:4943 (default)';
        }
      } else if (window.location.hostname.endsWith('.ic0.app') || window.location.hostname.endsWith('.icp0.io')) {
        diagnostics.network = 'ic (detected from hostname)';
        if (diagnostics.host === 'Unknown (configuration missing)') {
          diagnostics.host = 'https://ic0.app (default)';
        }
      }
    }
  } catch (error) {
    console.warn('Failed to extract backend diagnostics:', error);
  }

  return diagnostics;
}

/**
 * Performs a health check against the backend
 * Uses the public healthCheck endpoint that doesn't require authentication
 * Idempotent and safe to call multiple times during startup
 * Returns explicit status: pending, passed, failed, or timed-out
 * @returns Health check result with success status and message
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds

  try {
    // Create an anonymous actor for health check
    const actor = await Promise.race([
      createActorWithConfig(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check actor creation timed out')), HEALTH_CHECK_TIMEOUT)
      ),
    ]);

    // Call the public healthCheck endpoint
    const result = await Promise.race([
      (actor as any).healthCheck(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check call timed out')), HEALTH_CHECK_TIMEOUT)
      ),
    ]);

    if (result && result.message) {
      return {
        success: true,
        message: result.message,
        timestamp: result.timestamp ? Number(result.timestamp) : undefined,
        status: 'passed',
      };
    }

    return {
      success: true,
      message: 'Backend is reachable',
      status: 'passed',
    };
  } catch (error) {
    console.error('Health check failed:', error);
    
    let message = 'Backend is not reachable';
    let status: 'failed' | 'timed-out' = 'failed';
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('timed out') || errorMsg.includes('timeout')) {
        message = 'Health check timed out after 10 seconds';
        status = 'timed-out';
      } else if (errorMsg.includes('is stopped') || errorMsg.includes('canister is stopped')) {
        message = 'Backend canister is stopped';
        status = 'failed';
      } else if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        message = 'Backend canister not found or not deployed';
        status = 'failed';
      } else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
        message = 'Network error: Unable to reach backend';
        status = 'failed';
      } else {
        message = `Health check failed: ${error.message}`;
        status = 'failed';
      }
    }

    return {
      success: false,
      message,
      status,
    };
  }
}
