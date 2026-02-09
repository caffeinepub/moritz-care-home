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
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { performHealthCheck, getBackendDiagnostics } from './lib/startupDiagnostics';
import { isStoppedCanisterError } from './lib/actorInit';

const rootRoute = createRootRoute({
  component: RootComponent,
});

const STARTUP_TIMEOUT_MS = 45000; // 45 seconds max for startup

function RootComponent() {
  const { identity, isInitializing, clear } = useInternetIdentity();
  const { actor, isFetching: actorFetching, error: actorError, isError: actorIsError, refetch: actorRefetch } = useResilientActor();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched, error: profileError, isError: profileIsError, refetch: profileRefetch } = useGetCallerUserProfileStartup();
  const queryClient = useQueryClient();
  
  const [startupTimeout, setStartupTimeout] = useState(false);
  const [healthCheckResult, setHealthCheckResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const isAuthenticated = !!identity;
  const principalId = identity?.getPrincipal().toString();

  // Startup watchdog timer - triggers if actor or profile loading takes too long
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

  // Perform health check when startup fails
  useEffect(() => {
    const shouldCheckHealth = (actorIsError || profileIsError || startupTimeout) && !isCheckingHealth && !healthCheckResult;
    
    if (shouldCheckHealth) {
      setIsCheckingHealth(true);
      performHealthCheck()
        .then((result) => {
          setHealthCheckResult(result);
        })
        .catch(() => {
          setHealthCheckResult({
            success: false,
            message: 'Health check failed: Unable to reach backend'
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
    setHealthCheckResult(null);
    setIsCheckingHealth(false);
    
    // Clear only startup-relevant queries
    queryClient.removeQueries({ queryKey: ['resilient-actor'] });
    queryClient.removeQueries({ queryKey: ['currentUserProfile'] });
    
    // Re-run health check
    setIsCheckingHealth(true);
    try {
      const result = await performHealthCheck();
      setHealthCheckResult(result);
    } catch {
      setHealthCheckResult({
        success: false,
        message: 'Health check failed: Unable to reach backend'
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

  // Step 3: Startup timeout - show error screen
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
          setHealthCheckResult(null);
        }}
        isAuthenticated={isAuthenticated}
        principalId={principalId}
        backendDiagnostics={backendDiagnostics}
        healthCheckResult={healthCheckResult}
        showLogout={true}
      />
    );
  }

  // Step 4: Actor error - show error screen with retry
  if (actorIsError && actorError) {
    const backendDiagnostics = getBackendDiagnostics();
    const isReachable = healthCheckResult?.success || false;
    const isStopped = isStoppedCanisterError(actorError);
    
    let errorTitle = 'Connection Failed';
    let errorMessage = 'Unable to connect to the backend. ';
    
    if (isStopped) {
      errorTitle = 'Backend Canister Stopped';
      errorMessage = `The backend canister (${backendDiagnostics.canisterId}) is stopped and cannot process requests. Please contact the administrator to restart the canister.`;
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
        }}
        isAuthenticated={isAuthenticated}
        principalId={principalId}
        backendDiagnostics={backendDiagnostics}
        healthCheckResult={healthCheckResult}
        showLogout={isReachable}
      />
    );
  }

  // Step 5: Profile error - show error screen with retry
  if (profileIsError && profileError) {
    const backendDiagnostics = getBackendDiagnostics();
    const isReachable = healthCheckResult?.success || false;
    const isStopped = isStoppedCanisterError(profileError);
    
    let errorTitle = 'Profile Load Failed';
    let errorMessage = 'Unable to load your profile. ';
    
    if (isStopped) {
      errorTitle = 'Backend Canister Stopped';
      errorMessage = `The backend canister (${backendDiagnostics.canisterId}) is stopped and cannot process requests. Please contact the administrator to restart the canister.`;
    } else if (profileError.message.includes('Authorization') || profileError.message.includes('Unauthorized')) {
      errorMessage += 'You may not have the required permissions. Please contact an administrator.';
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
        }}
        isAuthenticated={isAuthenticated}
        principalId={principalId}
        backendDiagnostics={backendDiagnostics}
        healthCheckResult={healthCheckResult}
        showLogout={true}
      />
    );
  }

  // Step 6: Actor loading or not available
  if (actorFetching || !actor) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
          <p className="mt-4 text-lg text-gray-600">Connecting to backend...</p>
          <p className="mt-2 text-sm text-gray-500">This should only take a few seconds</p>
        </div>
      </div>
    );
  }

  // Step 7: Profile loading
  if (profileLoading || !profileFetched) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
          <p className="mt-4 text-lg text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Step 8: Profile setup needed
  const showProfileSetup = isAuthenticated && actor && profileFetched && userProfile === null;
  if (showProfileSetup) {
    return <ProfileSetup />;
  }

  // Step 9: All good - show app
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const residentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resident/$residentId',
  component: ResidentProfile,
});

const routeTree = rootRoute.addChildren([indexRoute, residentRoute]);

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
    </ThemeProvider>
  );
}
