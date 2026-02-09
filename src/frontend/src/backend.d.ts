import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Medication {
    id: bigint;
    status: MedicationStatus;
    dosage: string;
    prescribingPhysician?: Physician;
    name: string;
    administrationRoute: AdministrationRoute;
    administrationTimes: Array<string>;
    notes: string;
    dosageQuantity: string;
}
export interface Resident {
    id: bigint;
    bed?: string;
    status: ResidentStatus;
    weightLog: Array<WeightEntry>;
    dateOfBirth: bigint;
    admissionDate: bigint;
    marRecords: Array<MedicationAdministrationRecord>;
    adlRecords: Array<ADLRecord>;
    isArchived: boolean;
    roomNumber: string;
    insurance?: Insurance;
    medications: Array<Medication>;
    pharmacy?: Pharmacy;
    dailyVitals: Array<DailyVitals>;
    responsiblePersons: Array<ResponsiblePerson>;
    dischargeTimestamp?: bigint;
    medicaidNumber: string;
    physicians: Array<Physician>;
    lastName: string;
    roomType: RoomType;
    medicareNumber: string;
    firstName: string;
}
export interface Physician {
    id: bigint;
    name: string;
    specialty: string;
    contactNumber: string;
}
export interface ResponsiblePerson {
    id: bigint;
    relationship: string;
    name: string;
    address: string;
    contactNumber: string;
}
export interface Insurance {
    id: bigint;
    address: string;
    companyName: string;
    contactNumber: string;
    policyNumber: string;
}
export interface ADLRecord {
    id: bigint;
    residentId: bigint;
    staffNotes: string;
    assistanceLevel: string;
    date: bigint;
    activity: string;
}
export interface Pharmacy {
    id: bigint;
    name: string;
    address: string;
    contactNumber: string;
}
export interface DailyVitals {
    id: bigint;
    residentId: bigint;
    bloodGlucose?: bigint;
    respiratoryRate: bigint;
    temperature: number;
    pulseRate: bigint;
    oxygenSaturation: bigint;
    measurementDateTime: bigint;
    notes: string;
    bloodPressureDiastolic: bigint;
    bloodPressureSystolic: bigint;
}
export interface MedicationAdministrationRecord {
    id: bigint;
    medication: Medication;
    notes: string;
    administrationTime: bigint;
    administeredBy: string;
}
export interface WeightEntry {
    id: bigint;
    weight: number;
    residentId: bigint;
    weightUnit: string;
    notes: string;
    measurementDate: bigint;
}
export interface UserProfile {
    name: string;
    role: string;
    employeeId: string;
}
export enum AdministrationRoute {
    injection = "injection",
    inhaled = "inhaled",
    oral = "oral",
    intramuscular = "intramuscular",
    ophthalmic = "ophthalmic",
    transdermal = "transdermal",
    sublingual = "sublingual",
    intravenous = "intravenous",
    topical = "topical",
    subcutaneous = "subcutaneous",
    rectal = "rectal"
}
export enum MedicationStatus {
    active = "active",
    discontinued = "discontinued"
}
export enum ResidentStatus {
    active = "active",
    discharged = "discharged"
}
export enum RoomType {
    solo = "solo",
    sharedRoom = "sharedRoom"
}
export enum SortCriteria {
    bed = "bed",
    residentId = "residentId",
    name = "name",
    roomNumber = "roomNumber"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAdlRecord(residentId: bigint, date: bigint, activity: string, assistanceLevel: string, staffNotes: string): Promise<void>;
    addDailyVitals(residentId: bigint, temperature: number, bloodPressureSystolic: bigint, bloodPressureDiastolic: bigint, pulseRate: bigint, respiratoryRate: bigint, oxygenSaturation: bigint, bloodGlucose: bigint | null, measurementDateTime: bigint, notes: string): Promise<void>;
    addInsurance(companyName: string, policyNumber: string, address: string, contactNumber: string): Promise<void>;
    addMarRecord(residentId: bigint, medication: Medication, administrationTime: bigint, administeredBy: string, notes: string): Promise<void>;
    addMedication(residentId: bigint, name: string, dosage: string, administrationTimes: Array<string>, prescribingPhysician: Physician | null, administrationRoute: AdministrationRoute, dosageQuantity: string, notes: string): Promise<void>;
    addPharmacy(name: string, address: string, contactNumber: string): Promise<void>;
    addPhysician(name: string, contactNumber: string, specialty: string): Promise<void>;
    addResident(firstName: string, lastName: string, dateOfBirth: bigint, admissionDate: bigint, roomNumber: string, roomType: RoomType, bed: string | null, physiciansData: Array<Physician>, pharmacyData: Pharmacy | null, insuranceData: Insurance | null, medicaidNumber: string, medicareNumber: string, responsiblePersonsData: Array<ResponsiblePerson>, medications: Array<Medication>): Promise<void>;
    addResponsiblePerson(name: string, relationship: string, contactNumber: string, address: string): Promise<void>;
    addWeightEntry(residentId: bigint, weight: number, weightUnit: string, measurementDate: bigint, notes: string): Promise<void>;
    archiveResident(id: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    autoArchiveDischargedResidents(): Promise<void>;
    calculateAge(_dateOfBirth: bigint): Promise<bigint>;
    checkUpgradeHealth(): Promise<{
        residents: bigint;
        nextResidentId: bigint;
        userProfiles: bigint;
    }>;
    dischargeResident(id: bigint): Promise<void>;
    editMedication(residentId: bigint, medicationId: bigint, name: string, dosage: string, administrationTimes: Array<string>, prescribingPhysician: Physician | null, administrationRoute: AdministrationRoute, dosageQuantity: string, notes: string): Promise<void>;
    findResidentByRoom(roomNumber: string): Promise<Resident | null>;
    generateAdlReport(residentId: bigint): Promise<Array<ADLRecord>>;
    generateFullMedicationReport(residentId: bigint): Promise<Array<Medication>>;
    generateMarReport(residentId: bigint): Promise<Array<MedicationAdministrationRecord>>;
    generateMedicationReport(residentId: bigint): Promise<Array<Medication>>;
    generateResidentProfileReport(residentId: bigint): Promise<Resident | null>;
    getActiveResidents(): Promise<Array<Resident>>;
    getAllInsuranceCompanies(): Promise<Array<Insurance>>;
    getAllPharmacies(): Promise<Array<Pharmacy>>;
    getAllPhysicians(): Promise<Array<Physician>>;
    getAllResidents(): Promise<Array<Resident>>;
    getAllResponsiblePersons(): Promise<Array<ResponsiblePerson>>;
    getAllRoomNumbers(): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyVitals(residentId: bigint): Promise<Array<DailyVitals>>;
    getDischargedResidents(): Promise<Array<Resident>>;
    getFilteredAndSortedResidents(status: ResidentStatus | null, sortBy: SortCriteria | null): Promise<Array<Resident>>;
    getInsurance(id: bigint): Promise<Insurance | null>;
    getNonArchivedResidents(): Promise<Array<Resident>>;
    getPharmacy(id: bigint): Promise<Pharmacy | null>;
    getPhysician(id: bigint): Promise<Physician | null>;
    getResident(id: bigint): Promise<Resident | null>;
    getResidentCounts(): Promise<{
        activeResidents: bigint;
        archivedResidents: bigint;
        dischargedResidents: bigint;
        totalResidents: bigint;
    }>;
    getResidentRoomMap(): Promise<Array<[bigint, string]>>;
    getResidentStatistics(): Promise<{
        residentsByRoom: Array<[bigint, string, string]>;
        activeResidents: bigint;
        residentsByRoomType: Array<[bigint, string, RoomType]>;
        dischargedResidents: bigint;
        totalResidents: bigint;
    }>;
    getResidentsByRoom(roomNumber: string): Promise<Array<Resident>>;
    getResidentsByRoomType(roomType: RoomType): Promise<Array<Resident>>;
    getResponsiblePerson(id: bigint): Promise<ResponsiblePerson | null>;
    getSystemDiagnostics(includeSample: boolean): Promise<{
        nextIdCounters: {
            nextPharmacyId: bigint;
            nextResponsiblePersonId: bigint;
            nextResidentId: bigint;
            nextPhysicianId: bigint;
            nextInsuranceId: bigint;
            nextMedicationId: bigint;
            nextWeightEntryId: bigint;
            nextMarId: bigint;
            nextAdlId: bigint;
            nextDailyVitalsId: bigint;
        };
        sampleData?: Array<[bigint, string]>;
        aggregateCounts: {
            activeResidents: bigint;
            archivedResidents: bigint;
            dischargedResidents: bigint;
            totalResidents: bigint;
        };
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeightLog(residentId: bigint): Promise<Array<WeightEntry>>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateMedication(residentId: bigint, medicationId: bigint, name: string, dosage: string, administrationTimes: Array<string>, prescribingPhysician: Physician | null, administrationRoute: AdministrationRoute, dosageQuantity: string, notes: string, status: MedicationStatus): Promise<void>;
    updateMedicationStatus(residentId: bigint, medicationId: bigint, status: MedicationStatus): Promise<void>;
    updateResident(id: bigint, firstName: string, lastName: string, dateOfBirth: bigint, admissionDate: bigint, status: ResidentStatus, roomNumber: string, roomType: RoomType, bed: string | null, physicians: Array<Physician>, pharmacy: Pharmacy | null, insurance: Insurance | null, medicaidNumber: string, medicareNumber: string, responsiblePersons: Array<ResponsiblePerson>, medications: Array<Medication>): Promise<void>;
}
