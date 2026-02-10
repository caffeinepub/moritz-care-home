import { useActor } from '../hooks/useActor';
import { getBuildIdentifier, getBuildInfo } from '../lib/buildInfo';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

/**
 * Diagnostics indicator component
 * Displays frontend build version and backend canister ID
 */
export default function DiagnosticsIndicator() {
  const { actor } = useActor();
  const buildInfo = getBuildInfo();
  const buildId = getBuildIdentifier();

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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info className="h-3 w-3" />
            <span className="hidden sm:inline">
              Frontend: <span className="font-mono">{buildId}</span>
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
            <div>
              <span className="font-semibold">Frontend Build:</span> {buildId}
            </div>
            <div>
              <span className="font-semibold">Build Time:</span> {new Date(buildInfo.timestamp).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Backend Canister:</span> {canisterId}
            </div>
            <div>
              <span className="font-semibold">Environment:</span> {buildInfo.environment}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
