import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
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
// User Profile Queries
// ============================================================================

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ============================================================================
// Authorization Queries
// ============================================================================

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// ============================================================================
// Resident Queries
// ============================================================================

export function useGetAllResidents() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Resident[]>({
    queryKey: ['residents', 'all'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllResidents();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetActiveResidents() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Resident[]>({
    queryKey: ['residents', 'active'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getActiveResidents();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetDischargedResidents() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Resident[]>({
    queryKey: ['residents', 'discharged'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDischargedResidents();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetFilteredAndSortedResidents(
  status: ResidentStatus | null,
  sortBy: SortCriteria | null
) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Resident[]>({
    queryKey: ['residents', 'filtered', status, sortBy],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFilteredAndSortedResidents(status, sortBy);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetResident(id: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Resident | null>({
    queryKey: ['resident', id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      
      try {
        const resident = await actor.getResident(id);
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
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && id !== null,
    retry: false,
  });
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
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['resident', variables.id.toString()] });
    },
  });
}

export function useDischargeResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.dischargeResident(id);
    },
    onSuccess: (_, id) => {
      // Invalidate all resident list queries to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ['residents', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['residents', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['residents', 'discharged'] });
      queryClient.invalidateQueries({ queryKey: ['resident', id.toString()] });
    },
  });
}

export function useArchiveResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.archiveResident(id);
    },
    onSuccess: () => {
      // Invalidate all resident list queries
      queryClient.invalidateQueries({ queryKey: ['residents', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['residents', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['residents', 'discharged'] });
    },
  });
}

// Legacy hooks - kept for backward compatibility but not used in Dashboard
export function useToggleResidentStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      // Note: toggleResidentStatus is not in the backend interface
      // This is kept for backward compatibility but should not be used
      throw new Error('toggleResidentStatus is deprecated. Use dischargeResident or archiveResident instead.');
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['resident', id.toString()] });
    },
  });
}

export function useRemoveResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      // Note: removeResident is not in the backend interface
      // This is kept for backward compatibility but should not be used
      throw new Error('removeResident is deprecated. Use archiveResident instead.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
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

export function useEditMedication() {
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
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.editMedication(
        params.residentId,
        params.medicationId,
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
// MAR Records
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
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MedicationAdministrationRecord[]>({
    queryKey: ['marReport', residentId?.toString()],
    queryFn: async () => {
      if (!actor || !residentId) return [];
      return actor.generateMarReport(residentId);
    },
    enabled: !!actor && !actorFetching && residentId !== null,
  });
}

// ============================================================================
// ADL Records
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
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ADLRecord[]>({
    queryKey: ['adlReport', residentId?.toString()],
    queryFn: async () => {
      if (!actor || !residentId) return [];
      return actor.generateAdlReport(residentId);
    },
    enabled: !!actor && !actorFetching && residentId !== null,
  });
}

// ============================================================================
// Daily Vitals
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
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DailyVitals[]>({
    queryKey: ['dailyVitals', residentId?.toString()],
    queryFn: async () => {
      if (!actor || !residentId) return [];
      return actor.getDailyVitals(residentId);
    },
    enabled: !!actor && !actorFetching && residentId !== null,
  });
}

// ============================================================================
// Weight Entries
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
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WeightEntry[]>({
    queryKey: ['weightLog', residentId?.toString()],
    queryFn: async () => {
      if (!actor || !residentId) return [];
      return actor.getWeightLog(residentId);
    },
    enabled: !!actor && !actorFetching && residentId !== null,
  });
}

// ============================================================================
// Medication Reports
// ============================================================================

export function useGenerateMedicationReport(residentId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Medication[]>({
    queryKey: ['medicationReport', residentId?.toString()],
    queryFn: async () => {
      if (!actor || !residentId) return [];
      return actor.generateMedicationReport(residentId);
    },
    enabled: !!actor && !actorFetching && residentId !== null,
  });
}

export function useGenerateFullMedicationReport(residentId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Medication[]>({
    queryKey: ['fullMedicationReport', residentId?.toString()],
    queryFn: async () => {
      if (!actor || !residentId) return [];
      return actor.generateFullMedicationReport(residentId);
    },
    enabled: !!actor && !actorFetching && residentId !== null,
  });
}
