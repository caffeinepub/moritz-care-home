import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, LogOut, Info, Server, Network, Activity, Loader2, Terminal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { BackendDiagnostics, HealthCheckResult } from '../lib/startupDiagnostics';

interface StartupErrorScreenProps {
  title: string;
  message: string;
  error: Error | null;
  onRetry: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  principalId?: string;
  backendDiagnostics: BackendDiagnostics;
  healthCheckResult: HealthCheckResult | null;
  showLogout?: boolean;
}

export default function StartupErrorScreen({
  title,
  message,
  error,
  onRetry,
  onLogout,
  isAuthenticated,
  principalId,
  backendDiagnostics,
  healthCheckResult,
  showLogout = true,
}: StartupErrorScreenProps) {
  // Check if the error is specifically about a stopped canister
  const isStoppedCanister = healthCheckResult?.message?.includes('Backend canister is stopped') || 
                           healthCheckResult?.message?.includes('canister is stopped') ||
                           error?.message?.includes('canister is stopped');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-red-50 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-900">{title}</CardTitle>
          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Details */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">Error Details</h3>
                  <p className="mt-1 text-sm text-red-700">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stopped Canister Troubleshooting */}
          {isStoppedCanister && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
              <div className="flex items-start gap-3">
                <Terminal className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900">Backend Canister is Stopped</h3>
                  <p className="mt-2 text-sm text-orange-800">
                    The backend canister needs to be started by an operator with controller permissions.
                  </p>
                  
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-orange-900">Operator Instructions:</p>
                    
                    <div className="rounded bg-orange-100 p-3 font-mono text-xs text-orange-900">
                      <p className="mb-2"># Backend Canister ID:</p>
                      <p className="mb-3 font-semibold">{backendDiagnostics.canisterId}</p>
                      
                      <p className="mb-2"># Option 1: Use the restart script (recommended)</p>
                      <p className="mb-3">./frontend/scripts/restart_backend_canister.sh</p>
                      
                      <p className="mb-2"># Option 2: Manual dfx command</p>
                      <p>dfx canister --network ic start backend</p>
                    </div>
                    
                    <p className="text-xs text-orange-700 mt-2">
                      After starting the canister, refresh this page to reconnect.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Diagnostics Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <Server className="h-5 w-5" />
              Diagnostics
            </h3>

            <div className="grid gap-3 rounded-lg bg-gray-50 p-4 text-sm">
              {/* Authentication Status */}
              <div className="flex justify-between">
                <span className="text-gray-600">Authentication:</span>
                <span className="font-medium text-gray-900">
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>

              {/* Principal ID */}
              {principalId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Principal ID:</span>
                  <span className="font-mono text-xs text-gray-900">{principalId.slice(0, 20)}...</span>
                </div>
              )}

              <Separator />

              {/* Backend Configuration */}
              <div className="flex items-center gap-2 font-semibold text-gray-700">
                <Network className="h-4 w-4" />
                Backend Configuration
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Canister ID:</span>
                <span className="font-mono text-xs text-gray-900">
                  {backendDiagnostics.canisterId}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium text-gray-900">{backendDiagnostics.network}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Host:</span>
                <span className="font-mono text-xs text-gray-900">{backendDiagnostics.host}</span>
              </div>

              {/* Health Check Result */}
              {healthCheckResult && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Health Check:</span>
                    <span className="flex items-center gap-1">
                      {healthCheckResult.status === 'pending' && (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="font-medium text-blue-600">Checking...</span>
                        </>
                      )}
                      {healthCheckResult.status === 'passed' && (
                        <>
                          <Activity className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">Passed</span>
                        </>
                      )}
                      {healthCheckResult.status === 'failed' && (
                        <>
                          <Network className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-600">Failed</span>
                        </>
                      )}
                      {healthCheckResult.status === 'timed-out' && (
                        <>
                          <Network className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-600">Timed Out</span>
                        </>
                      )}
                      {!healthCheckResult.status && (
                        <span
                          className={`font-medium ${
                            healthCheckResult.success ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {healthCheckResult.success ? 'Passed' : 'Failed'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">{healthCheckResult.message}</div>
                </>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onRetry} className="w-full sm:flex-1" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>
          {showLogout && (
            <Button onClick={onLogout} className="w-full sm:flex-1" variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
