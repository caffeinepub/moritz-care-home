import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useResilientActor } from './useResilientActor';
import { useInternetIdentity } from './useInternetIdentity';
import { withTimeout, normalizeError, isAuthorizationError } from '../lib/actorInit';
import { PROFILE_STARTUP_TIMEOUT_MS, RESIDENT_QUERY_TIMEOUT_MS, RESIDENT_FETCH_TIMEOUT_MS } from '../lib/startupTimings';
import { mapRegistrationError } from '../lib/registrationErrorMapping';
import type {
  Resident,
  UserProfile,
  Medication,
  MedicationAdministrationRecord,
  ADLRecord,
  DailyVitals,
  WeightEntry,
  ResidentStatus,
  MedicationStatus,
  AdministrationRoute,
  Physician,
  Pharmacy,
  Insurance,
  ResponsiblePerson,
  RoomType,
  SortCriteria,
} from '../backend';

// ============================================================================
// Baseline Access Registration (Post-Login Initialization)
// ============================================================================

/**
 * Ensures the caller is registered with baseline user access after login.
 * This must succeed before attempting to load the user profile.
 */
export function useEnsureRegisteredUser() {
  const { actor, isFetching: actorFetching, isError: actorIsError } = useResilientActor();
  const { identity } = useInternetIdentity();

  const principal = identity?.getPrincipal().toString() || 'anonymous';

  const query = useQuery<void, Error>({
    queryKey: ['baselineAccess', principal],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');

      try {
        await withTimeout(
          actor.ensureRegisteredUser(),
          PROFILE_STARTUP_TIMEOUT_MS,
          'User registration timed out: The backend is taking too long to respond'
        );
      } catch (error) {
        // Use the new registration error mapping for accurate messages
        const mappedMessage = mapRegistrationError(error);
        throw new Error(mappedMessage);
      }
    },
    enabled: !!actor && !actorFetching && !actorIsError && principal !== 'anonymous',
    retry: false,
    staleTime: Infinity, // Only needs to succeed once per session
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !actorFetching && query.isFetched,
  };
}

// ============================================================================
// User Profile Queries
// ============================================================================

/**
 * Startup-safe profile query that uses the resilient actor
 * This is used during app initialization to prevent infinite loading states
 * IMPORTANT: This query should only be enabled after baseline access succeeds
 * Query is scoped by principal to prevent stale cache across account switches
 */
export function useGetCallerUserProfileStartup() {
  const { actor, isFetching: actorFetching, isError: actorIsError } = useResilientActor();
  const { identity } = useInternetIdentity();
  const { data: baselineAccessData, isLoading: baselineLoading, isFetched: baselineFetched, isError: baselineIsError, error: baselineError } = useEnsureRegisteredUser();

  const principal = identity?.getPrincipal().toString() || 'anonymous';

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', principal],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        // Wrap profile fetch with timeout to fail fast
        const profile = await withTimeout(
          actor.getCallerUserProfile(),
          PROFILE_STARTUP_TIMEOUT_MS,
          'Profile load timed out: The backend is taking too long to respond'
        );
        return profile;
      } catch (error) {
        // Normalize error for consistent handling
        const normalizedMessage = normalizeError(error);
        
        // If this is an authorization error after baseline access succeeded,
        // it means the user needs to set up their profile (return null)
        if (isAuthorizationError(error)) {
          // This is expected for first-time users - return null to trigger ProfileSetup
          return null;
        }
        
        throw new Error(normalizedMessage);
      }
    },
    // Only enable after baseline access succeeds
    enabled: !!actor && !actorFetching && !actorIsError && !baselineLoading && baselineFetched && !baselineIsError && principal !== 'anonymous',
    retry: false,
  });

  return {
    ...query,
    // Include baseline loading state in overall loading
    isLoading: actorFetching || baselineLoading || query.isLoading,
    isFetched: !!actor && !actorFetching && baselineFetched && query.isFetched,
    // Propagate baseline error with mapped message
    error: baselineIsError ? baselineError : query.error,
    isError: baselineIsError || query.isError,
  };
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const principal = identity?.getPrincipal().toString() || 'anonymous';

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', principal],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && principal !== 'anonymous',
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

/**
 * Startup-safe profile save mutation using resilient actor
 * Used during ProfileSetup to avoid dependency on immutable useActor hook
 * After successful save, invalidates and refetches the profile to trigger UI transition
 */
export function useSaveCallerUserProfileStartup() {
  const { actor } = useResilientActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principal = identity?.getPrincipal().toString() || 'anonymous';

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) {
        throw new Error('Backend connection not available. Please refresh the page and try again.');
      }
      
      try {
        await actor.saveCallerUserProfile(profile);
      } catch (error) {
        console.error('Profile save error:', error);
        
        // Provide clear, actionable error messages
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          
          if (msg.includes('actor not available') || msg.includes('not initialized')) {
            throw new Error('Backend connection not available. Please refresh the page and try again.');
          }
          
          if (msg.includes('unauthorized') || msg.includes('trap') || msg.includes('permission')) {
            throw new Error('Unable to save profile: You do not have the required permissions. Please contact an administrator to provision your account.');
          }
          
          if (msg.includes('network') || msg.includes('fetch')) {
            throw new Error('Network error: Unable to reach the backend. Please check your internet connection and try again.');
          }
          
          if (msg.includes('timeout') || msg.includes('timed out')) {
            throw new Error('Request timed out: The backend is taking too long to respond. Please try again.');
          }
          
          // Return the original error message if it's already descriptive
          if (error.message.length > 20) {
            throw error;
          }
        }
        
        // Fallback for unknown errors
        throw new Error('Failed to save profile. Please try again or contact support if the problem persists.');
      }
    },
    onSuccess: async () => {
      // Invalidate and refetch the profile query to trigger UI transition
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principal] });
      await queryClient.refetchQueries({ queryKey: ['currentUserProfile', principal] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principal = identity?.getPrincipal().toString() || 'anonymous';

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      try {
        await actor.saveCallerUserProfile(profile);
      } catch (error) {
        // Provide clear error messages for authorization issues
        if (error instanceof Error) {
          if (error.message.includes('Unauthorized') || error.message.includes('trap')) {
            throw new Error('Unable to save profile: You may not have the required permissions. Please contact an administrator.');
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principal] });
    },
  });
}

// ============================================================================
// Authorization Queries
// ============================================================================

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching, isError: actorIsError } = useResilientActor();
  const { identity } = useInternetIdentity();

  // Include principal in query key to ensure fresh data on login/logout
  const principal = identity?.getPrincipal().toString() || 'anonymous';

  const query = useQuery<boolean>({
    queryKey: ['isCallerAdmin', principal],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      // Defensive check: ensure the method exists
      if (typeof actor.isCallerAdmin !== 'function') {
        console.error('Backend compatibility issue: isCallerAdmin method not found');
        throw new Error('Backend appears out of date or incompatible. The admin check method is not available. Please ensure the backend canister is properly deployed.');
      }

      try {
        const result = await withTimeout(
          actor.isCallerAdmin(),
          RESIDENT_QUERY_TIMEOUT_MS,
          'Admin check timed out: The backend is taking too long to respond'
        );
        return result;
      } catch (error) {
        console.error('Admin check error:', error);
        // Normalize authorization errors
        const normalized = normalizeError(error);
        throw new Error(normalized);
      }
    },
    enabled: !!actor && !actorFetching && !actorIsError,
    retry: 1, // Retry once in case of transient errors
    // Don't cache across sessions
    staleTime: 0,
  });

  return {
    ...query,
    // Expose loading state explicitly so UI can defer rendering admin controls
    isLoading: actorFetching || query.isLoading,
    // Expose refetch for retry
    refetch: query.refetch,
  };
}

// ============================================================================
// Resident Queries
// ============================================================================

export function useGetAllResidents() {
  const { actor, isFetching: actorFetching, isError: actorIsError } = useResilientActor();

  const query = useQuery<Resident[]>({
    queryKey: ['residents', 'all'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const residents = await withTimeout(
          actor.getAllResidents(),
          RESIDENT_QUERY_TIMEOUT_MS,
          'Resident list load timed out: The backend is taking too long to respond'
        );
        return residents;
      } catch (error) {
        const normalized = normalizeError(error);
        throw new Error(normalized);
      }
    },
    enabled: !!actor && !actorFetching && !actorIsError,
    retry: 1,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    // Expose refetch for retry
    refetch: query.refetch,
  };
}

export function useGetActiveResidents() {
  const { actor, isFetching: actorFetching, isError: actorIsError } = useResilientActor();

  const query = useQuery<Resident[]>({
    queryKey: ['residents', 'active'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const residents = await withTimeout(
          actor.getActiveResidents(),
          RESIDENT_QUERY_TIMEOUT_MS,
          'Active residents load timed out: The backend is taking too long to respond'
        );
        return residents;
      } catch (error) {
        const normalized = normalizeError(error);
        throw new Error(normalized);
      }
    },
    enabled: !!actor && !actorFetching && !actorIsError,
    retry: 1,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    // Expose refetch for retry
    refetch: query.refetch,
  };
}

export function useGetDischargedResidents() {
  const { actor, isFetching: actorFetching, isError: actorIsError } = useResilientActor();

  const query = useQuery<Resident[]>({
    queryKey: ['residents', 'discharged'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const residents = await withTimeout(
          actor.getDischargedResidents(),
          RESIDENT_QUERY_TIMEOUT_MS,
          'Discharged residents load timed out: The backend is taking too long to respond'
        );
        return residents;
      } catch (error) {
        const normalized = normalizeError(error);
        throw new Error(normalized);
      }
    },
    enabled: !!actor && !actorFetching && !actorIsError,
    retry: 1,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    // Expose refetch for retry
    refetch: query.refetch,
  };
}

export function useGetFilteredAndSortedResidents(
  status: ResidentStatus | null,
  sortBy: SortCriteria | null
) {
  const { actor, isFetching: actorFetching, isError: actorIsError } = useResilientActor();

  const query = useQuery<Resident[]>({
    queryKey: ['residents', 'filtered', status, sortBy],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const residents = await withTimeout(
          actor.getFilteredAndSortedResidents(status, sortBy),
          RESIDENT_QUERY_TIMEOUT_MS,
          'Filtered residents load timed out: The backend is taking too long to respond'
        );
        return residents;
      } catch (error) {
        const normalized = normalizeError(error);
        throw new Error(normalized);
      }
    },
    enabled: !!actor && !actorFetching && !actorIsError,
    retry: 1,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    // Expose refetch for retry
    refetch: query.refetch,
  };
}

export function useGetResident(id: bigint | null) {
  const { actor, isFetching: actorFetching, isError: actorIsError } = useResilientActor();

  const query = useQuery<Resident | null>({
    queryKey: ['resident', id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      
      try {
        const resident = await withTimeout(
          actor.getResident(id),
          RESIDENT_FETCH_TIMEOUT_MS,
          'Resident fetch timed out: The backend is taking too long to respond'
        );
        return resident;
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.message.includes('Unauthorized')) {
            throw new Error('UNAUTHORIZED');
          }
          if (error.message.includes('not found')) {
            return null;
          }
        }
        const normalized = normalizeError(error);
        throw new Error(normalized);
      }
    },
    enabled: !!actor && !actorFetching && !actorIsError && id !== null,
    retry: 1,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    // Expose refetch for retry
    refetch: query.refetch,
  };
}

/**
 * Normalize backend authorization errors into consistent user-facing messages
 */
function normalizeAuthError(error: unknown): Error {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('unauthorized') || msg.includes('only admins') || msg.includes('trap')) {
      return new Error('You do not have permission to perform this action. Only administrators can manage residents.');
    }
  }
  return error instanceof Error ? error : new Error('An unexpected error occurred');
}

export function useAddResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      firstName: string;
      lastName: string;
      dateOfBirth: bigint;
      admissionDate: bigint;
      roomNumber: string;
      roomType: RoomType;
      bed: string | null;
      physiciansData: Physician[];
      pharmacyData: Pharmacy | null;
      insuranceData: Insurance | null;
      medicaidNumber: string;
      medicareNumber: string;
      responsiblePersonsData: ResponsiblePerson[];
      medications: Medication[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        await actor.addResident(
          params.firstName,
          params.lastName,
          params.dateOfBirth,
          params.admissionDate,
          params.roomNumber,
          params.roomType,
          params.bed,
          params.physiciansData,
          params.pharmacyData,
          params.insuranceData,
          params.medicaidNumber,
          params.medicareNumber,
          params.responsiblePersonsData,
          params.medications
        );
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useUpdateResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      firstName: string;
      lastName: string;
      dateOfBirth: bigint;
      admissionDate: bigint;
      status: ResidentStatus;
      roomNumber: string;
      roomType: RoomType;
      bed: string | null;
      physicians: Physician[];
      pharmacy: Pharmacy | null;
      insurance: Insurance | null;
      medicaidNumber: string;
      medicareNumber: string;
      responsiblePersons: ResponsiblePerson[];
      medications: Medication[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        await actor.updateResident(
          params.id,
          params.firstName,
          params.lastName,
          params.dateOfBirth,
          params.admissionDate,
          params.status,
          params.roomNumber,
          params.roomType,
          params.bed,
          params.physicians,
          params.pharmacy,
          params.insurance,
          params.medicaidNumber,
          params.medicareNumber,
          params.responsiblePersons,
          params.medications
        );
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['resident'] });
    },
  });
}

export function useDischargeResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      try {
        await actor.dischargeResident(id);
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['resident'] });
    },
  });
}

export function useDeleteResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      try {
        await actor.permanentlyDeleteResident(id);
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['resident'] });
    },
  });
}

// ============================================================================
// Medication Queries
// ============================================================================

export function useAddMedication() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      residentId: bigint;
      name: string;
      dosage: string;
      administrationTimes: string[];
      prescribingPhysician: Physician | null;
      administrationRoute: AdministrationRoute;
      dosageQuantity: string;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addMedication(
        params.residentId,
        params.name,
        params.dosage,
        params.administrationTimes,
        params.prescribingPhysician,
        params.administrationRoute,
        params.dosageQuantity,
        params.notes
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useUpdateMedication() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      residentId: bigint;
      medicationId: bigint;
      name: string;
      dosage: string;
      administrationTimes: string[];
      prescribingPhysician: Physician | null;
      administrationRoute: AdministrationRoute;
      dosageQuantity: string;
      notes: string;
      status: MedicationStatus;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateMedication(
        params.residentId,
        params.medicationId,
        params.name,
        params.dosage,
        params.administrationTimes,
        params.prescribingPhysician,
        params.administrationRoute,
        params.dosageQuantity,
        params.notes,
        params.status
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useUpdateMedicationStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      residentId: bigint;
      medicationId: bigint;
      status: MedicationStatus;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateMedicationStatus(
        params.residentId,
        params.medicationId,
        params.status
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

// ============================================================================
// MAR Record Queries
// ============================================================================

export function useAddMarRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      residentId: bigint;
      medication: Medication;
      administrationTime: bigint;
      administeredBy: string;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addMarRecord(
        params.residentId,
        params.medication,
        params.administrationTime,
        params.administeredBy,
        params.notes
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId.toString()] });
    },
  });
}

export function useGenerateMarReport(residentId: bigint | null) {
  const { actor } = useActor();

  return useQuery<MedicationAdministrationRecord[]>({
    queryKey: ['marReport', residentId?.toString()],
    queryFn: async () => {
      if (!actor || !residentId) return [];
      return actor.generateMarReport(residentId);
    },
    enabled: !!actor && residentId !== null,
  });
}

// ============================================================================
// ADL Record Queries
// ============================================================================

export function useAddAdlRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      residentId: bigint;
      date: bigint;
      activity: string;
      assistanceLevel: string;
      staffNotes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addAdlRecord(
        params.residentId,
        params.date,
        params.activity,
        params.assistanceLevel,
        params.staffNotes
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId.toString()] });
    },
  });
}

export function useGenerateAdlReport(residentId: bigint | null) {
  const { actor } = useActor();

  return useQuery<ADLRecord[]>({
    queryKey: ['adlReport', residentId?.toString()],
    queryFn: async () => {
      if (!actor || !residentId) return [];
      return actor.generateAdlReport(residentId);
    },
    enabled: !!actor && residentId !== null,
  });
}

// ============================================================================
// Daily Vitals Queries
// ============================================================================

export function useAddDailyVitals() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      residentId: bigint;
      temperature: number;
      bloodPressureSystolic: bigint;
      bloodPressureDiastolic: bigint;
      pulseRate: bigint;
      respiratoryRate: bigint;
      oxygenSaturation: bigint;
      bloodGlucose: bigint | null;
      measurementDateTime: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addDailyVitals(
        params.residentId,
        params.temperature,
        params.bloodPressureSystolic,
        params.bloodPressureDiastolic,
        params.pulseRate,
        params.respiratoryRate,
        params.oxygenSaturation,
        params.bloodGlucose,
        params.measurementDateTime,
        params.notes
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['dailyVitals', variables.residentId.toString()] });
    },
  });
}

export function useGetDailyVitals(residentId: bigint | null) {
  const { actor } = useActor();

  return useQuery<DailyVitals[]>({
    queryKey: ['dailyVitals', residentId?.toString()],
    queryFn: async () => {
      if (!actor || !residentId) return [];
      return actor.getDailyVitals(residentId);
    },
    enabled: !!actor && residentId !== null,
  });
}

// ============================================================================
// Weight Entry Queries
// ============================================================================

export function useAddWeightEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      residentId: bigint;
      weight: number;
      weightUnit: string;
      measurementDate: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addWeightEntry(
        params.residentId,
        params.weight,
        params.weightUnit,
        params.measurementDate,
        params.notes
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['weightLog', variables.residentId.toString()] });
    },
  });
}

export function useGetWeightLog(residentId: bigint | null) {
  const { actor } = useActor();

  return useQuery<WeightEntry[]>({
    queryKey: ['weightLog', residentId?.toString()],
    queryFn: async () => {
      if (!actor || !residentId) return [];
      return actor.getWeightLog(residentId);
    },
    enabled: !!actor && residentId !== null,
  });
}
