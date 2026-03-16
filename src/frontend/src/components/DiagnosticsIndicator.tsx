import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, AlertTriangle, CheckCircle, Info } from "lucide-react";
import React from "react";
import { getBuildInfo } from "../lib/buildInfo";
import { getBackendDiagnostics } from "../lib/startupDiagnostics";

export default function DiagnosticsIndicator() {
  const diagnostics = getBackendDiagnostics();
  const buildInfo = getBuildInfo();

  const hasCanisterId = diagnostics.canisterId !== "Not configured";
  const hasMetadata = buildInfo.hasMetadata;

  const isHealthy = hasCanisterId;
  const hasWarning = !hasCanisterId || !hasMetadata;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-colors hover:bg-muted/50"
            aria-label="Backend diagnostics"
          >
            {hasWarning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-success" />
            )}
            <span className="text-muted-foreground hidden sm:inline">
              {hasCanisterId
                ? `${diagnostics.canisterId.slice(0, 8)}...`
                : "No canister"}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            {isHealthy ? (
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
            )}
            <span className="font-semibold text-sm">Backend Diagnostics</span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Canister ID</span>
              <span className="font-mono text-right break-all">
                {hasCanisterId ? (
                  diagnostics.canisterId
                ) : (
                  <span className="text-warning">Not configured</span>
                )}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Host</span>
              <span className="font-mono text-right">{diagnostics.host}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Environment</span>
              <span className="font-mono text-right">
                {diagnostics.environment}
              </span>
            </div>
          </div>

          {buildInfo.hasMetadata && (
            <div className="border-t border-border pt-2 space-y-1 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Info className="w-3 h-3" />
                <span>Build Info</span>
              </div>
              {buildInfo.buildId && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Build ID</span>
                  <span className="font-mono text-right">
                    {buildInfo.buildId}
                  </span>
                </div>
              )}
              {buildInfo.buildTime && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Built</span>
                  <span className="font-mono text-right">
                    {buildInfo.buildTime}
                  </span>
                </div>
              )}
            </div>
          )}

          {!hasMetadata && (
            <div className="border-t border-border pt-2">
              <p className="text-xs text-muted-foreground">
                Missing build metadata — deploy via{" "}
                <code className="bg-muted px-1 rounded">
                  redeploy_production.sh
                </code>{" "}
                to inject build info.
              </p>
            </div>
          )}

          {!hasCanisterId && (
            <div className="border-t border-border pt-2">
              <p className="text-xs text-warning">
                Canister ID not found in environment variables. Check Vite
                config and deployment setup.
              </p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
