import { useInternetIdentity } from './useInternetIdentity';
import { useQuery } from '@tanstack/react-query';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';
import { withTimeout, normalizeError, isNonFatalError } from '../lib/actorInit';

const ACTOR_QUERY_KEY = 'resilient-actor';
const ACTOR_TIMEOUT_MS = 30000; // 30 seconds
const INIT_TIMEOUT_MS = 15000; // 15 seconds for initialization

export function useResilientActor() {
  const { identity } = useInternetIdentity();

  const actorQuery = useQuery<backendInterface, Error>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      try {
        const isAuthenticated = !!identity;

        // Step 1: Create actor with timeout
        const actorOptions = isAuthenticated
          ? {
              agentOptions: {
                identity,
              },
            }
          : undefined;

        const actor = await withTimeout(
          createActorWithConfig(actorOptions),
          ACTOR_TIMEOUT_MS,
          'Connection timed out: Unable to create backend actor'
        );

        // Step 2: Best-effort admin initialization (only if token exists)
        const adminToken = getSecretParameter('caffeineAdminToken');
        
        if (adminToken && adminToken.trim() !== '') {
          try {
            await withTimeout(
              actor._initializeAccessControlWithSecret(adminToken),
              INIT_TIMEOUT_MS,
              'Access control initialization timed out'
            );
          } catch (initError) {
            // Check if this is a non-fatal error
            if (isNonFatalError(initError)) {
              console.warn('Access control initialization warning:', normalizeError(initError));
              // Continue with the actor - this is not a fatal error
            } else {
              // For other errors, log but continue (best-effort)
              console.error('Access control initialization failed:', normalizeError(initError));
              // We still return the actor - the backend will handle permissions
            }
          }
        }

        return actor;
      } catch (error) {
        // Normalize and re-throw the error for React Query to handle
        const normalizedMessage = normalizeError(error);
        throw new Error(normalizedMessage);
      }
    },
    staleTime: Infinity,
    retry: false, // Don't auto-retry, let user trigger retry
    enabled: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
    error: actorQuery.error || null,
    isError: actorQuery.isError,
    refetch: actorQuery.refetch,
  };
}
