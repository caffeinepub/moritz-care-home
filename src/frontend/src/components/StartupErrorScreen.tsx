import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  LogOut,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";
import React from "react";
import type { HealthCheckResult } from "../lib/startupDiagnostics";

export interface BackendDiagnostics {
  canisterId: string;
  host: string;
  environment: string;
}

export interface StartupErrorScreenProps {
  title: string;
  message: string;
  isAuthenticated: boolean;
  backendDiagnostics: BackendDiagnostics;
  healthCheckResult?: HealthCheckResult | null;
  error?: Error | null;
  onRetry: () => void;
  onLogout: () => void;
}

export default function StartupErrorScreen({
  title,
  message,
  isAuthenticated,
  backendDiagnostics,
  healthCheckResult,
  onRetry,
  onLogout,
}: StartupErrorScreenProps) {
  const isNetworkError =
    message.toLowerCase().includes("network") ||
    message.toLowerCase().includes("fetch") ||
    message.toLowerCase().includes("timeout");

  const isStoppedCanister =
    message.toLowerCase().includes("stopped") ||
    message.toLowerCase().includes("canister stopped");

  const isNotFound =
    message.toLowerCase().includes("not found") ||
    message.toLowerCase().includes("canister not found");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Icon + Title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
        </div>

        {/* Context-specific guidance */}
        {isStoppedCanister && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground">
            <p className="font-medium mb-1">Backend canister is stopped</p>
            <p className="text-muted-foreground">
              The backend canister needs to be restarted. Please contact your
              administrator.
            </p>
          </div>
        )}

        {isNetworkError && !isStoppedCanister && (
          <div className="rounded-lg border border-muted bg-muted/30 p-4 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">Network connectivity issue</p>
            </div>
            <p className="text-muted-foreground">
              Check your internet connection and try again.
            </p>
          </div>
        )}

        {isNotFound && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
            <p className="font-medium mb-1">Canister not found</p>
            <p className="text-muted-foreground">
              The backend canister ID may be incorrect or the canister may have
              been deleted.
            </p>
          </div>
        )}

        {/* Health check result */}
        {healthCheckResult && (
          <div className="rounded-lg border bg-card p-4 text-sm space-y-1">
            <div className="flex items-center gap-2">
              {healthCheckResult.success ? (
                <Wifi className="h-4 w-4 text-success" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <span className="font-medium">
                Health check: {healthCheckResult.success ? "Passed" : "Failed"}
              </span>
              <span className="text-muted-foreground ml-auto">
                {healthCheckResult.durationMs}ms
              </span>
            </div>
          </div>
        )}

        {/* Backend diagnostics */}
        <div className="rounded-lg border bg-card p-4 text-sm space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">
              Backend Diagnostics
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <span className="text-muted-foreground">Canister ID</span>
            <span className="font-mono break-all">
              {backendDiagnostics.canisterId || (
                <span className="text-destructive">Not configured</span>
              )}
            </span>
            <span className="text-muted-foreground">Host</span>
            <span className="font-mono">{backendDiagnostics.host}</span>
            <span className="text-muted-foreground">Environment</span>
            <span className="font-mono">{backendDiagnostics.environment}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={onRetry} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          {isAuthenticated && (
            <Button
              variant="outline"
              onClick={onLogout}
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
