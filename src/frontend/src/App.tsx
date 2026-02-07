import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useResilientActor } from './hooks/useResilientActor';
import { useGetCallerUserProfile } from './hooks/useQueries';
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

const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching, error: actorError, isError: actorIsError, refetch: actorRefetch } = useResilientActor();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const principalId = identity?.getPrincipal().toString();

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

  // Step 3: Actor error - show error screen with retry
  if (actorIsError && actorError) {
    return (
      <StartupErrorScreen
        title="Connection Failed"
        message="Unable to connect to the backend. Please check your connection and try again."
        error={actorError}
        onRetry={() => {
          // Clear all queries and refetch actor
          queryClient.clear();
          actorRefetch();
        }}
        isAuthenticated={isAuthenticated}
        principalId={principalId}
      />
    );
  }

  // Step 4: Actor loading or not available
  if (actorFetching || !actor) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
          <p className="mt-4 text-lg text-gray-600">Connecting to backend...</p>
        </div>
      </div>
    );
  }

  // Step 5: Profile loading
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

  // Step 6: Profile setup needed
  const showProfileSetup = isAuthenticated && actor && profileFetched && userProfile === null;
  if (showProfileSetup) {
    return <ProfileSetup />;
  }

  // Step 7: All good - show app
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
