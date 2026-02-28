import React, { useEffect, useRef, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './components/ProfileSetup';
import StartupErrorScreen from './components/StartupErrorScreen';
import { performHealthCheck, type HealthCheckResult, getBackendDiagnostics } from './lib/startupDiagnostics';
import { OVERALL_WATCHDOG_TIMEOUT, PROFILE_QUERY_TIMEOUT } from './lib/startupTimings';
import { Loader2 } from 'lucide-react';

type AppPhase =
  | 'initializing'
  | 'connecting'
  | 'loading-profile'
  | 'profile-setup'
  | 'dashboard'
  | 'login'
  | 'error';

export default function App() {
  const { identity, isInitializing: identityInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<AppPhase>('initializing');
  const [startupError, setStartupError] = useState<Error | null>(null);
  const [healthCheckResult, setHealthCheckResult] = useState<HealthCheckResult | null>(null);

  const isAuthenticated = !!identity;
  const actorReady = !!actor && !actorFetching;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    isError: profileIsError,
    error: profileQueryError,
  } = useGetCallerUserProfile();

  // Suppress unused warning — profileLoading used implicitly via isFetched
  void profileLoading;

  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWatchdog = () => {
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
  };
  const clearProfileTimeout = () => {
    if (profileTimeoutRef.current) { clearTimeout(profileTimeoutRef.current); profileTimeoutRef.current = null; }
  };

  // Overall startup watchdog
  useEffect(() => {
    watchdogRef.current = setTimeout(async () => {
      setPhase((current) => {
        if (current === 'initializing' || current === 'connecting') {
          performHealthCheck().then((result) => {
            setHealthCheckResult(result);
          });
          setStartupError(new Error('Startup timed out. The backend may be unavailable.'));
          return 'error';
        }
        return current;
      });
    }, OVERALL_WATCHDOG_TIMEOUT);

    return () => clearWatchdog();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1: Identity initializing
  useEffect(() => {
    if (identityInitializing) {
      setPhase('initializing');
    }
  }, [identityInitializing]);

  // Step 2: Identity resolved
  useEffect(() => {
    if (identityInitializing) return;

    if (!isAuthenticated) {
      clearWatchdog();
      clearProfileTimeout();
      setPhase('login');
      return;
    }

    if (!actorReady) {
      setPhase('connecting');
    }
  }, [identityInitializing, isAuthenticated, actorReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 3: Actor ready → start loading profile
  useEffect(() => {
    if (!actorReady || !isAuthenticated) return;

    setPhase('loading-profile');

    clearProfileTimeout();
    profileTimeoutRef.current = setTimeout(() => {
      setPhase((current) => {
        if (current === 'loading-profile') {
          setStartupError(
            new Error('Profile loading timed out. The backend may be slow or unavailable. Please retry.')
          );
          return 'error';
        }
        return current;
      });
    }, PROFILE_QUERY_TIMEOUT);

    return () => clearProfileTimeout();
  }, [actorReady, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 4: Profile query resolved
  useEffect(() => {
    if (!actorReady || !isAuthenticated) return;
    if (!profileFetched) return;

    clearWatchdog();
    clearProfileTimeout();

    if (profileIsError) {
      setStartupError(
        profileQueryError instanceof Error
          ? profileQueryError
          : new Error('Failed to load user profile. Please retry.')
      );
      setPhase('error');
      return;
    }

    if (userProfile !== null && userProfile !== undefined) {
      setPhase('dashboard');
    } else {
      setPhase('profile-setup');
    }
  }, [actorReady, isAuthenticated, profileFetched, profileIsError, profileQueryError, userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = async () => {
    setStartupError(null);
    setHealthCheckResult(null);
    queryClient.clear();
    window.location.reload();
  };

  const handleLogout = async () => {
    queryClient.clear();
    window.location.reload();
  };

  const handleProfileSetupComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    setPhase('dashboard');
  };

  if (phase === 'login') {
    return <LoginPage />;
  }

  if (phase === 'error') {
    const { canisterId, host } = getBackendDiagnostics();
    return (
      <StartupErrorScreen
        title="Startup Error"
        message={startupError?.message ?? 'An unexpected error occurred during startup.'}
        isAuthenticated={isAuthenticated}
        backendDiagnostics={{ canisterId, host, environment: import.meta.env.MODE ?? 'unknown' }}
        healthCheckResult={healthCheckResult}
        onRetry={handleRetry}
        onLogout={handleLogout}
      />
    );
  }

  if (phase === 'profile-setup') {
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  if (phase === 'dashboard') {
    return <Dashboard />;
  }

  const loadingMessage =
    phase === 'initializing'
      ? 'Initializing...'
      : phase === 'connecting'
        ? 'Connecting to backend...'
        : phase === 'loading-profile'
          ? 'Loading profile...'
          : 'Starting up...';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">{loadingMessage}</p>
      </div>
    </div>
  );
}
