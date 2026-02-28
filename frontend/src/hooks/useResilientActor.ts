import { useInternetIdentity } from './useInternetIdentity';
import { useQuery } from '@tanstack/react-query';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';
import { withTimeout, normalizeError, isNonFatalError } from '../lib/actorInit';
import { ACTOR_CREATION_TIMEOUT, ADMIN_INIT_TIMEOUT } from '../lib/startupTimings';

const ACTOR_QUERY_KEY = 'resilient-actor';

export function useResilientActor() {
  const { identity } = useInternetIdentity();

  const actorQuery = useQuery<backendInterface, Error>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      try {
        const isAuthenticated = !!identity;

        const actorOptions = isAuthenticated
          ? { agentOptions: { identity } }
          : undefined;

        const actor = await withTimeout(
          createActorWithConfig(actorOptions),
          ACTOR_CREATION_TIMEOUT,
          'Connection timed out: Unable to create backend actor'
        );

        // Best-effort admin initialization — skip when no token present
        const adminToken = getSecretParameter('caffeineAdminToken');
        if (adminToken && adminToken.trim() !== '') {
          try {
            await withTimeout(
              (actor as any)._initializeAccessControlWithSecret(adminToken),
              ADMIN_INIT_TIMEOUT,
              'Access control initialization timed out'
            );
          } catch (initError) {
            if (isNonFatalError(initError)) {
              console.warn('Access control initialization warning:', normalizeError(initError));
            } else {
              console.error('Access control initialization failed:', normalizeError(initError));
            }
          }
        }

        return actor;
      } catch (error) {
        throw new Error(normalizeError(error));
      }
    },
    staleTime: Infinity,
    retry: false,
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
