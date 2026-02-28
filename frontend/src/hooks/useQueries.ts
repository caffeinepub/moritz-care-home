import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  UserProfileWithRole,
  RoomType,
  Physician,
  Pharmacy,
  Insurance,
  ResponsiblePerson,
  Medication,
} from '../backend';
import { ProfileSetupError } from '../backend';
import { PROFILE_QUERY_TIMEOUT } from '../lib/startupTimings';

// ─── Local types not exported by backend.d.ts ────────────────────────────────

export interface Resident {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: number;
  admissionDate: number;
  status: 'active' | 'discharged';
  roomNumber: string;
  roomType: string;
  bed?: string;
  physicians: Physician[];
  pharmacy?: Pharmacy;
  insurance?: Insurance;
  medicaidNumber: string;
  medicareNumber: string;
  responsiblePersons: ResponsiblePerson[];
  medications: Medication[];
  marRecords: MedicationAdministrationRecord[];
  adlRecords: ADLRecord[];
  dailyVitals: DailyVitals[];
  weightLog: WeightEntry[];
  dischargeTimestamp?: number;
  isArchived: boolean;
}

export interface MedicationAdministrationRecord {
  id: number;
  medication: Medication;
  administrationTime: number;
  administeredBy: string;
  notes: string;
}

export interface ADLRecord {
  id: number;
  residentId: number;
  date: number;
  activity: string;
  assistanceLevel: string;
  staffNotes: string;
}

export interface DailyVitals {
  id: number;
  residentId: number;
  temperature: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  pulseRate: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  bloodGlucose?: number;
  measurementDateTime: number;
  notes: string;
}

export interface WeightEntry {
  id: number;
  residentId: number;
  weight: number;
  weightUnit: string;
  measurementDate: number;
  notes: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfileWithRole | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Identity not available');

      const principal = identity.getPrincipal();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Profile query timed out after ${PROFILE_QUERY_TIMEOUT}ms`)),
          PROFILE_QUERY_TIMEOUT
        )
      );

      const result = await Promise.race([
        actor.getUserProfileWithRole(principal),
        timeoutPromise,
      ]);

      if (result.__kind__ === 'ok') {
        return result.ok;
      } else if (result.__kind__ === 'err' && result.err === ProfileSetupError.NotFound) {
        return null;
      }
      return null;
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: 2,
    staleTime: 30000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!identity && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_profile: { name: string; employeeId: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.ensureRegisteredUser();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Residents ───────────────────────────────────────────────────────────────

export function useGetActiveResidents() {
  const { actor, isFetching } = useActor();

  return useQuery<Resident[]>({
    queryKey: ['residents', 'active'],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getNonArchivedResidentsAccessControl();
      const residents: Resident[] = (result || []).map((r: any) => normalizeResident(r));
      return residents.filter((r) => r.status === 'active');
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDischargedResidents() {
  const { actor, isFetching } = useActor();

  return useQuery<Resident[]>({
    queryKey: ['residents', 'discharged'],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getNonArchivedResidentsAccessControl();
      const residents: Resident[] = (result || []).map((r: any) => normalizeResident(r));
      return residents.filter((r) => r.status === 'discharged');
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetNonArchivedResidents() {
  const { actor, isFetching } = useActor();

  return useQuery<Resident[]>({
    queryKey: ['residents', 'nonArchived'],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getNonArchivedResidentsAccessControl();
      return (result || []).map((r: any) => normalizeResident(r));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetResident(id: number | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Resident | null>({
    queryKey: ['resident', id],
    queryFn: async () => {
      if (!actor || id === null) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getResidentAccessControl(BigInt(id));
      if (!result) return null;
      if (result.__kind__ === 'ok') return normalizeResident(result.ok);
      if (result.__kind__ === 'err') return null;
      return normalizeResident(result);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useAddResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
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
      await actor.addResidentAccessControl(
        data.firstName,
        data.lastName,
        data.dateOfBirth,
        data.admissionDate,
        data.roomNumber,
        data.roomType,
        data.bed,
        data.physiciansData,
        data.pharmacyData,
        data.insuranceData,
        data.medicaidNumber,
        data.medicareNumber,
        data.responsiblePersonsData,
        data.medications
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useDischargeResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (residentId: number) => {
      if (!actor) throw new Error('Actor not available');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).v105_dischargeResidentAccessControl(BigInt(residentId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function usePermanentlyDeleteResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (residentId: number) => {
      if (!actor) throw new Error('Actor not available');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).v105_permanentlyDeleteResidentAccessControl(BigInt(residentId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useAddMarRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      residentId: number;
      medicationId: number;
      administrationTime: number;
      administeredBy: string;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).addMarRecordAccessControl(BigInt(data.residentId), {
        medicationId: BigInt(data.medicationId),
        administrationTime: BigInt(data.administrationTime),
        administeredBy: data.administeredBy,
        notes: data.notes,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useAddAdlRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      residentId: number;
      date: number;
      activity: string;
      assistanceLevel: string;
      staffNotes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).addAdlRecordAccessControl(BigInt(data.residentId), {
        residentId: BigInt(data.residentId),
        date: BigInt(data.date),
        activity: data.activity,
        assistanceLevel: data.assistanceLevel,
        staffNotes: data.staffNotes,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useAddDailyVitals() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      residentId: number;
      temperature: number;
      bloodPressureSystolic: number;
      bloodPressureDiastolic: number;
      pulseRate: number;
      respiratoryRate: number;
      oxygenSaturation: number;
      bloodGlucose?: number;
      measurementDateTime: number;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).addDailyVitalsAccessControl(BigInt(data.residentId), {
        residentId: BigInt(data.residentId),
        temperature: data.temperature,
        bloodPressureSystolic: BigInt(data.bloodPressureSystolic),
        bloodPressureDiastolic: BigInt(data.bloodPressureDiastolic),
        pulseRate: BigInt(data.pulseRate),
        respiratoryRate: BigInt(data.respiratoryRate),
        oxygenSaturation: BigInt(data.oxygenSaturation),
        bloodGlucose: data.bloodGlucose != null ? [BigInt(data.bloodGlucose)] : [],
        measurementDateTime: BigInt(data.measurementDateTime),
        notes: data.notes,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useAddWeightEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      residentId: number;
      weight: number;
      weightUnit: string;
      measurementDate: number;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).addWeightEntryAccessControl(BigInt(data.residentId), {
        residentId: BigInt(data.residentId),
        weight: data.weight,
        weightUnit: data.weightUnit,
        measurementDate: BigInt(data.measurementDate),
        notes: data.notes,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useAddMedication() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      residentId: number;
      name: string;
      dosage: string;
      administrationTimes: string[];
      prescribingPhysician?: Physician;
      administrationRoute: string;
      dosageQuantity: string;
      notes: string;
      status: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).addMedicationAccessControl(BigInt(data.residentId), {
        name: data.name,
        dosage: data.dosage,
        administrationTimes: data.administrationTimes,
        prescribingPhysician: data.prescribingPhysician ?? null,
        administrationRoute: data.administrationRoute,
        dosageQuantity: data.dosageQuantity,
        notes: data.notes,
        status: data.status,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useUpdateMedication() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      residentId: number;
      medicationId: number;
      name: string;
      dosage: string;
      administrationTimes: string[];
      prescribingPhysician?: Physician;
      administrationRoute: string;
      dosageQuantity: string;
      notes: string;
      status: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).updateMedicationAccessControl(BigInt(data.residentId), {
        id: BigInt(data.medicationId),
        name: data.name,
        dosage: data.dosage,
        administrationTimes: data.administrationTimes,
        prescribingPhysician: data.prescribingPhysician ?? null,
        administrationRoute: data.administrationRoute,
        dosageQuantity: data.dosageQuantity,
        notes: data.notes,
        status: data.status,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useUpdateResident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      residentId: number;
      updates: Partial<Resident>;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).updateResidentAccessControl(BigInt(data.residentId), data.updates);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Keep old name as alias for backward compat
export { useIsCallerAdmin as useIsAdmin };

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeResident(r: any): Resident {
  return {
    id: typeof r.id === 'bigint' ? Number(r.id) : r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    dateOfBirth: typeof r.dateOfBirth === 'bigint' ? Number(r.dateOfBirth) : r.dateOfBirth,
    admissionDate: typeof r.admissionDate === 'bigint' ? Number(r.admissionDate) : r.admissionDate,
    status: r.status?.__kind__ ?? r.status ?? 'active',
    roomNumber: r.roomNumber,
    roomType: r.roomType?.__kind__ ?? r.roomType ?? 'solo',
    bed: r.bed?.__kind__ === 'Some' ? r.bed.value : r.bed ?? undefined,
    physicians: r.physicians ?? [],
    pharmacy: r.pharmacy?.__kind__ === 'Some' ? r.pharmacy.value : r.pharmacy ?? undefined,
    insurance: r.insurance?.__kind__ === 'Some' ? r.insurance.value : r.insurance ?? undefined,
    medicaidNumber: r.medicaidNumber ?? '',
    medicareNumber: r.medicareNumber ?? '',
    responsiblePersons: r.responsiblePersons ?? [],
    medications: r.medications ?? [],
    marRecords: (r.marRecords ?? []).map((m: any) => ({
      ...m,
      id: typeof m.id === 'bigint' ? Number(m.id) : m.id,
      administrationTime: typeof m.administrationTime === 'bigint' ? Number(m.administrationTime) : m.administrationTime,
    })),
    adlRecords: (r.adlRecords ?? []).map((a: any) => ({
      ...a,
      id: typeof a.id === 'bigint' ? Number(a.id) : a.id,
      residentId: typeof a.residentId === 'bigint' ? Number(a.residentId) : a.residentId,
      date: typeof a.date === 'bigint' ? Number(a.date) : a.date,
    })),
    dailyVitals: (r.dailyVitals ?? []).map((v: any) => ({
      ...v,
      id: typeof v.id === 'bigint' ? Number(v.id) : v.id,
      residentId: typeof v.residentId === 'bigint' ? Number(v.residentId) : v.residentId,
      measurementDateTime: typeof v.measurementDateTime === 'bigint' ? Number(v.measurementDateTime) : v.measurementDateTime,
      bloodPressureSystolic: typeof v.bloodPressureSystolic === 'bigint' ? Number(v.bloodPressureSystolic) : v.bloodPressureSystolic,
      bloodPressureDiastolic: typeof v.bloodPressureDiastolic === 'bigint' ? Number(v.bloodPressureDiastolic) : v.bloodPressureDiastolic,
      pulseRate: typeof v.pulseRate === 'bigint' ? Number(v.pulseRate) : v.pulseRate,
      respiratoryRate: typeof v.respiratoryRate === 'bigint' ? Number(v.respiratoryRate) : v.respiratoryRate,
      oxygenSaturation: typeof v.oxygenSaturation === 'bigint' ? Number(v.oxygenSaturation) : v.oxygenSaturation,
      bloodGlucose: v.bloodGlucose != null ? (typeof v.bloodGlucose === 'bigint' ? Number(v.bloodGlucose) : v.bloodGlucose) : undefined,
    })),
    weightLog: (r.weightLog ?? []).map((w: any) => ({
      ...w,
      id: typeof w.id === 'bigint' ? Number(w.id) : w.id,
      residentId: typeof w.residentId === 'bigint' ? Number(w.residentId) : w.residentId,
      measurementDate: typeof w.measurementDate === 'bigint' ? Number(w.measurementDate) : w.measurementDate,
    })),
    dischargeTimestamp: r.dischargeTimestamp?.__kind__ === 'Some'
      ? Number(r.dischargeTimestamp.value)
      : r.dischargeTimestamp != null
        ? Number(r.dischargeTimestamp)
        : undefined,
    isArchived: r.isArchived ?? false,
  };
}
