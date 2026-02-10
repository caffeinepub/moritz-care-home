import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useResilientActor } from './hooks/useResilientActor';
import { useGetCallerUserProfileStartup } from './hooks/useQueries';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ResidentProfile from './pages/ResidentProfile';
import ProfileSetup from './components/ProfileSetup';
import StartupErrorScreen from './components/StartupErrorScreen';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Loader2, Server, Network, Activity } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { performHealthCheck, getBackendDiagnostics } from './lib/startupDiagnostics';
import { isStoppedCanisterError, isCanisterNotFoundError, isNetworkError, isTimeoutError } from './lib/actorInit';
import { isAnonymousAccessError } from './lib/registrationErrorMapping';
import { STARTUP_TIMEOUT_MS, FAIL_FAST_MS, HEALTHCHECK_EARLY_TRIGGER_MS } from './lib/startupTimings';

const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { identity, isInitializing, clear } = useInternetIdentity();
  const { actor, isFetching: actorFetching, error: actorError, isError: actorIsError, refetch: actorRefetch } = useResilientActor();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched, error: profileError, isError: profileIsError, refetch: profileRefetch } = useGetCallerUserProfileStartup();
  const queryClient = useQueryClient();
  
  const [startupTimeout, setStartupTimeout] = useState(false);
  const [failFastTimeout, setFailFastTimeout] = useState(false);
  const [healthCheckResult, setHealthCheckResult] = useState<{ success: boolean; message: string; status?: 'pending' | 'passed' | 'failed' | 'timed-out' } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const healthCheckTriggeredRef = useRef(false);

  const isAuthenticated = !!identity;
  const principalId = identity?.getPrincipal().toString();

  // Early health check trigger - runs when loading is slow (5s)
  useEffect(() => {
    if (isAuthenticated && (actorFetching || profileLoading || !actor) && !healthCheckTriggeredRef.current) {
      const earlyTimer = setTimeout(() => {
        if (!healthCheckResult && !isCheckingHealth) {
          healthCheckTriggeredRef.current = true;
          setIsCheckingHealth(true);
          setHealthCheckResult({ success: false, message: 'Checking backend health...', status: 'pending' });
          performHealthCheck()
            .then((result) => {
              setHealthCheckResult({
                success: result.success,
                message: result.message,
                status: result.success ? 'passed' : 'failed'
              });
            })
            .catch((err) => {
              const isTimeout = err?.message?.includes('timed out');
              setHealthCheckResult({
                success: false,
                message: isTimeout ? 'Health check timed out' : 'Health check failed: Unable to reach backend',
                status: isTimeout ? 'timed-out' : 'failed'
              });
            })
            .finally(() => {
              setIsCheckingHealth(false);
            });
        }
      }, HEALTHCHECK_EARLY_TRIGGER_MS);

      return () => clearTimeout(earlyTimer);
    }
  }, [isAuthenticated, actorFetching, profileLoading, actor, healthCheckResult, isCheckingHealth]);

  // Fast-fail timeout - triggers when backend is reachable but slow (15s)
  useEffect(() => {
    if (isAuthenticated && (actorFetching || profileLoading || !actor)) {
      const fastTimer = setTimeout(() => {
        // Only trigger fast-fail if health check succeeded (backend is reachable but slow)
        if (healthCheckResult?.success) {
          setFailFastTimeout(true);
        }
      }, FAIL_FAST_MS);

      return () => clearTimeout(fastTimer);
    } else {
      setFailFastTimeout(false);
    }
  }, [isAuthenticated, actorFetching, profileLoading, actor, healthCheckResult]);

  // Overall startup watchdog timer - fallback if other mechanisms don't trigger (45s)
  useEffect(() => {
    if (isAuthenticated && (actorFetching || profileLoading || !actor)) {
      const timer = setTimeout(() => {
        setStartupTimeout(true);
      }, STARTUP_TIMEOUT_MS);

      return () => clearTimeout(timer);
    } else {
      setStartupTimeout(false);
    }
  }, [isAuthenticated, actorFetching, profileLoading, actor]);

  // Perform health check when startup fails (if not already done)
  useEffect(() => {
    const shouldCheckHealth = (actorIsError || profileIsError || startupTimeout) && !isCheckingHealth && !healthCheckResult;
    
    if (shouldCheckHealth) {
      setIsCheckingHealth(true);
      setHealthCheckResult({ success: false, message: 'Checking backend health...', status: 'pending' });
      performHealthCheck()
        .then((result) => {
          setHealthCheckResult({
            success: result.success,
            message: result.message,
            status: result.success ? 'passed' : 'failed'
          });
        })
        .catch((err) => {
          const isTimeout = err?.message?.includes('timed out');
          setHealthCheckResult({
            success: false,
            message: isTimeout ? 'Health check timed out' : 'Health check failed: Unable to reach backend',
            status: isTimeout ? 'timed-out' : 'failed'
          });
        })
        .finally(() => {
          setIsCheckingHealth(false);
        });
    }
  }, [actorIsError, profileIsError, startupTimeout, isCheckingHealth, healthCheckResult]);

  // Retry handler that resets all startup state and re-runs health check
  const handleRetry = async () => {
    setStartupTimeout(false);
    setFailFastTimeout(false);
    setHealthCheckResult(null);
    setIsCheckingHealth(false);
    healthCheckTriggeredRef.current = false;
    
    // Clear startup-relevant queries including baseline access and profile (scoped by principal)
    queryClient.removeQueries({ queryKey: ['resilient-actor'] });
    queryClient.removeQueries({ queryKey: ['baselineAccess'] });
    queryClient.removeQueries({ queryKey: ['currentUserProfile'] });
    queryClient.removeQueries({ queryKey: ['residents'] });
    queryClient.removeQueries({ queryKey: ['isCallerAdmin'] });
    
    // Re-run health check
    setIsCheckingHealth(true);
    setHealthCheckResult({ success: false, message: 'Checking backend health...', status: 'pending' });
    try {
      const result = await performHealthCheck();
      setHealthCheckResult({
        success: result.success,
        message: result.message,
        status: result.success ? 'passed' : 'failed'
      });
    } catch (err) {
      const isTimeout = err instanceof Error && err.message.includes('timed out');
      setHealthCheckResult({
        success: false,
        message: isTimeout ? 'Health check timed out' : 'Health check failed: Unable to reach backend',
        status: isTimeout ? 'timed-out' : 'failed'
      });
    } finally {
      setIsCheckingHealth(false);
    }
    
    // Trigger fresh actor and profile queries
    actorRefetch();
    profileRefetch();
  };

  // Step 1: Identity initializing
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
          <p className="mt-4 text-lg text-gray-600">Loading Moritz Care Home...</p>
        </div>
      </div>
    );
  }

  // Step 2: Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Step 3: Fast-fail timeout - backend is reachable but slow
  if (failFastTimeout && !actorIsError && !profileIsError) {
    const backendDiagnostics = getBackendDiagnostics();
    
    return (
      <StartupErrorScreen
        title="Backend Responding Slowly"
        message="The backend is reachable but taking longer than expected to respond. This may be due to high load or initialization delays. Please try again."
        error={new Error('Backend is reachable but responding slowly (exceeded ' + (FAIL_FAST_MS / 1000) + ' seconds)')}
        onRetry={handleRetry}
        onLogout={async () => {
          await clear();
          queryClient.clear();
          setStartupTimeout(false);
          setFailFastTimeout(false);
          setHealthCheckResult(null);
          healthCheckTriggeredRef.current = false;
        }}
        isAuthenticated={isAuthenticated}
        principalId={principalId}
        backendDiagnostics={backendDiagnostics}
        healthCheckResult={healthCheckResult}
        showLogout={true}
      />
    );
  }

  // Step 4: Detect stalled actor creation (actor is null, not fetching, not errored)
  // This catches the "stuck on connecting" scenario
  if (isAuthenticated && !actor && !actorFetching && !actorIsError && startupTimeout) {
    const backendDiagnostics = getBackendDiagnostics();
    
    return (
      <StartupErrorScreen
        title="Actor Creation Stalled"
        message="The backend actor could not be initialized. This may indicate a configuration issue or the backend canister may not be properly deployed. Please check the diagnostics below and try again."
        error={new Error('Actor creation stalled: actor is null but not fetching or errored')}
        onRetry={handleRetry}
        onLogout={async () => {
          await clear();
          queryClient.clear();
          setStartupTimeout(false);
          setFailFastTimeout(false);
          setHealthCheckResult(null);
          healthCheckTriggeredRef.current = false;
        }}
        isAuthenticated={isAuthenticated}
        principalId={principalId}
        backendDiagnostics={backendDiagnostics}
        healthCheckResult={healthCheckResult}
        showLogout={true}
      />
    );
  }

  // Step 5: Startup timeout - show error screen
  if (startupTimeout) {
    const backendDiagnostics = getBackendDiagnostics();
    const isReachable = healthCheckResult?.success || false;
    
    let errorTitle = 'Connection Timeout';
    let errorMessage = 'The backend is taking too long to respond. ';
    
    if (isReachable) {
      errorMessage += 'The backend is reachable, but you may need to set up your profile or check your permissions.';
    } else {
      errorMessage += 'Please check your internet connection and ensure the backend is properly deployed.';
    }

    return (
      <StartupErrorScreen
        title={errorTitle}
        message={errorMessage}
        error={new Error('Startup timed out after ' + (STARTUP_TIMEOUT_MS / 1000) + ' seconds')}
        onRetry={handleRetry}
        onLogout={async () => {
          await clear();
          queryClient.clear();
          setStartupTimeout(false);
          setFailFastTimeout(false);
          setHealthCheckResult(null);
          healthCheckTriggeredRef.current = false;
        }}
        isAuthenticated={isAuthenticated}
        principalId={principalId}
        backendDiagnostics={backendDiagnostics}
        healthCheckResult={healthCheckResult}
        showLogout={true}
      />
    );
  }

  // Step 6: Actor error - show error screen with retry and improved classification
  if (actorIsError && actorError) {
    const backendDiagnostics = getBackendDiagnostics();
    const isReachable = healthCheckResult?.success || false;
    const isStopped = isStoppedCanisterError(actorError);
    const isNotFound = isCanisterNotFoundError(actorError);
    const isNetwork = isNetworkError(actorError);
    const isTimeout = isTimeoutError(actorError);
    
    let errorTitle = 'Connection Failed';
    let errorMessage = 'Unable to connect to the backend. ';
    
    if (isStopped) {
      errorTitle = 'Backend Canister Stopped';
      errorMessage = `The backend canister is stopped and cannot process requests. Please contact the administrator to restart the canister.`;
      if (backendDiagnostics.canisterId && !backendDiagnostics.canisterId.includes('Unknown')) {
        errorMessage = `The backend canister (${backendDiagnostics.canisterId}) is stopped and cannot process requests. Please contact the administrator to restart the canister.`;
      }
    } else if (isNotFound) {
      errorTitle = 'Backend Canister Not Found';
      errorMessage = 'The backend canister could not be found. The application may not be properly deployed or the canister ID may be incorrect.';
      if (backendDiagnostics.canisterId.includes('Unknown')) {
        errorMessage += ' Additionally, the canister ID configuration is missing or unknown.';
      }
    } else if (isNetwork) {
      errorTitle = 'Network Error';
      errorMessage = 'Unable to reach the backend due to a network error. Please check your internet connection and try again.';
    } else if (isTimeout) {
      errorTitle = 'Connection Timeout';
      errorMessage = 'The connection to the backend timed out. The backend may be experiencing high load or may be unreachable.';
    } else if (isReachable) {
      errorMessage += 'The backend is reachable, but there may be an authorization or configuration issue.';
    } else {
      errorMessage += 'Please check your connection and try again.';
    }

    return (
      <StartupErrorScreen
        title={errorTitle}
        message={errorMessage}
        error={actorError}
        onRetry={handleRetry}
        onLogout={async () => {
          await clear();
          queryClient.clear();
          setHealthCheckResult(null);
          setFailFastTimeout(false);
          healthCheckTriggeredRef.current = false;
        }}
        isAuthenticated={isAuthenticated}
        principalId={principalId}
        backendDiagnostics={backendDiagnostics}
        healthCheckResult={healthCheckResult}
        showLogout={isReachable}
      />
    );
  }

  // Step 7: Profile error - show error screen with retry and improved classification
  // Use the new registration error mapping for accurate messages
  if (profileIsError && profileError) {
    const backendDiagnostics = getBackendDiagnostics();
    const isReachable = healthCheckResult?.success || false;
    const isStopped = isStoppedCanisterError(profileError);
    const isNotFound = isCanisterNotFoundError(profileError);
    const isNetwork = isNetworkError(profileError);
    const isTimeout = isTimeoutError(profileError);
    const isAnonymous = isAnonymousAccessError(profileError);
    
    let errorTitle = 'Profile Load Failed';
    let errorMessage = 'Unable to load your profile. ';
    
    // Special handling for anonymous access errors
    if (isAnonymous) {
      errorTitle = 'Authentication Required';
      errorMessage = profileError.message;
    } else if (isStopped) {
      errorTitle = 'Backend Canister Stopped';
      errorMessage = `The backend canister is stopped and cannot process requests. Please contact the administrator to restart the canister.`;
      if (backendDiagnostics.canisterId && !backendDiagnostics.canisterId.includes('Unknown')) {
        errorMessage = `The backend canister (${backendDiagnostics.canisterId}) is stopped and cannot process requests. Please contact the administrator to restart the canister.`;
      }
    } else if (isNotFound) {
      errorTitle = 'Backend Canister Not Found';
      errorMessage = 'The backend canister could not be found while loading your profile. The application may not be properly deployed.';
    } else if (isNetwork) {
      errorTitle = 'Network Error';
      errorMessage = 'Unable to load your profile due to a network error. Please check your internet connection and try again.';
    } else if (isTimeout) {
      errorTitle = 'Profile Load Timed Out';
      errorMessage = 'Loading your profile took too long. ';
      if (isReachable) {
        errorMessage += 'The backend is reachable but may be experiencing high load.';
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
    } else if (profileError.message.includes('Authorization') || profileError.message.includes('Unauthorized')) {
      // Use the error message from the registration error mapping
      errorMessage = profileError.message;
    } else if (isReachable) {
      errorMessage += 'The backend is reachable, but there was an error loading your profile.';
    } else {
      errorMessage += 'Please check your connection and try again.';
    }

    return (
      <StartupErrorScreen
        title={errorTitle}
        message={errorMessage}
        error={profileError}
        onRetry={handleRetry}
        onLogout={async () => {
          await clear();
          queryClient.clear();
          setHealthCheckResult(null);
          setFailFastTimeout(false);
          healthCheckTriggeredRef.current = false;
        }}
        isAuthenticated={isAuthenticated}
        principalId={principalId}
        backendDiagnostics={backendDiagnostics}
        healthCheckResult={healthCheckResult}
        showLogout={true}
      />
    );
  }

  // Step 8: Actor loading or not available - show diagnostics during connection
  if (actorFetching || !actor) {
    const backendDiagnostics = getBackendDiagnostics();
    const showDiagnostics = healthCheckResult !== null || isCheckingHealth;
    
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 px-4">
        <div className="w-full max-w-md text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
          <p className="mt-4 text-lg text-gray-600">Connecting to backend...</p>
          <p className="mt-2 text-sm text-gray-500">This should only take a few seconds</p>
          
          {showDiagnostics && (
            <div className="mt-6 rounded-lg bg-white p-4 text-left shadow-md">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Server className="h-4 w-4" />
                Backend Diagnostics
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Network:</span>
                  <span className="font-mono text-gray-800">{backendDiagnostics.network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Host:</span>
                  <span className="font-mono text-gray-800">{backendDiagnostics.host}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Canister ID:</span>
                  <span className="font-mono text-gray-800">{backendDiagnostics.canisterId}</span>
                </div>
                {healthCheckResult && (
                  <div className="mt-3 flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-2">
                    <span className="text-gray-600">Health Check:</span>
                    <div className="flex items-center gap-2">
                      {healthCheckResult.status === 'pending' && (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                          <span className="text-blue-600">Checking...</span>
                        </>
                      )}
                      {healthCheckResult.status === 'passed' && (
                        <>
                          <Activity className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">Passed</span>
                        </>
                      )}
                      {healthCheckResult.status === 'failed' && (
                        <>
                          <Network className="h-3 w-3 text-red-500" />
                          <span className="text-red-600">Failed</span>
                        </>
                      )}
                      {healthCheckResult.status === 'timed-out' && (
                        <>
                          <Network className="h-3 w-3 text-orange-500" />
                          <span className="text-orange-600">Timed Out</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 9: Profile loading - show loading state
  if (profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
          <p className="mt-4 text-lg text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Step 10: Profile setup required - show ProfileSetup component
  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;
  if (showProfileSetup) {
    return <ProfileSetup />;
  }

  // Step 11: Authenticated with profile - show main app
  return <Outlet />;
}

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const residentProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resident/$residentId',
  component: ResidentProfile,
});

const routeTree = rootRoute.addChildren([dashboardRoute, residentProfileRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
