import { useActor } from '../hooks/useActor';
import { getBuildIdentifier, getBuildInfo, isBuildMetadataMissing } from '../lib/buildInfo';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertTriangle } from 'lucide-react';

/**
 * Diagnostics indicator component displaying frontend build version and backend canister ID with explicit detection of missing build metadata in production.
 */
export default function DiagnosticsIndicator() {
  const { actor } = useActor();
  const buildInfo = getBuildInfo();
  const buildId = getBuildIdentifier();
  const metadataMissing = isBuildMetadataMissing();

  // Extract canister ID from actor if available
  const getCanisterId = (): string => {
    if (!actor) return 'Not connected';
    
    try {
      // Try to get canister ID from the actor's agent
      const canisterId = (actor as any)._canisterId?.toString();
      if (canisterId) {
        // Shorten for display
        return canisterId.length > 15 
          ? `${canisterId.substring(0, 8)}...${canisterId.substring(canisterId.length - 5)}`
          : canisterId;
      }
    } catch (e) {
      // Ignore errors
    }
    
    return 'Unknown';
  };

  const canisterId = getCanisterId();

  // Determine display values
  const frontendDisplay = metadataMissing ? 'Unknown' : (buildId || 'Unknown');
  const showWarning = metadataMissing || canisterId === 'Not connected' || canisterId === 'Unknown';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {showWarning ? (
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
            ) : (
              <Info className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
              Frontend: <span className="font-mono">{frontendDisplay}</span>
            </span>
            <span className="text-gray-400">|</span>
            <span className="hidden md:inline">
              Backend: <span className="font-mono">{canisterId}</span>
            </span>
            <Badge variant="outline" className="text-xs">
              {buildInfo.environment}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            {metadataMissing && (
              <div className="mb-2 rounded bg-yellow-100 p-2 text-yellow-800">
                <span className="font-semibold">⚠️ Missing build metadata</span>
                <p className="mt-1 text-xs">
                  The frontend may not have deployed correctly. Build environment variables were not injected.
                </p>
              </div>
            )}
            <div>
              <span className="font-semibold">Frontend Build:</span>{' '}
              {metadataMissing ? 'Unknown (missing metadata)' : (buildId || 'Unknown')}
            </div>
            {buildInfo.timestamp && (
              <div>
                <span className="font-semibold">Build Time:</span>{' '}
                {new Date(buildInfo.timestamp).toLocaleString()}
              </div>
            )}
            <div>
              <span className="font-semibold">Backend Canister:</span> {canisterId}
            </div>
            <div>
              <span className="font-semibold">Environment:</span> {buildInfo.environment}
            </div>
            {buildInfo.version && (
              <div>
                <span className="font-semibold">Version:</span> {buildInfo.version}
              </div>
            )}
            {buildInfo.commit && (
              <div>
                <span className="font-semibold">Commit:</span> {buildInfo.commit}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
