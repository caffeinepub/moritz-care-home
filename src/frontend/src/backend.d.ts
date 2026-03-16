import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface UserProfileWithRole {
    name: string;
    role: string;
    employeeId: string;
}
export interface Pharmacy {
    id: bigint;
    name: string;
    address: string;
    contactNumber: string;
}
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
export enum ProfileSetupError {
    NotFound = "NotFound"
}
export enum RoomType {
    solo = "solo",
    sharedRoom = "sharedRoom"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addResidentAccessControl(firstName: string, lastName: string, dateOfBirth: bigint, admissionDate: bigint, roomNumber: string, roomType: RoomType, bed: string | null, physiciansData: Array<Physician>, pharmacyData: Pharmacy | null, insuranceData: Insurance | null, medicaidNumber: string, medicareNumber: string, responsiblePersonsData: Array<ResponsiblePerson>, medications: Array<Medication>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    ensureRegisteredUser(): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfileWithRole(_user: Principal): Promise<{
        __kind__: "ok";
        ok: UserProfileWithRole;
    } | {
        __kind__: "err";
        err: ProfileSetupError;
    }>;
    healthCheck(): Promise<{
        message: string;
        timestamp?: bigint;
    }>;
    isCallerAdmin(): Promise<boolean>;
}
