import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  type Resident = {
    id : Nat;
    firstName : Text;
    lastName : Text;
    dateOfBirth : Int;
    admissionDate : Int;
    status : ResidentStatus;
    roomNumber : Text;
    roomType : RoomType;
    bed : ?Text;
    physicians : [Physician];
    pharmacy : ?Pharmacy;
    insurance : ?Insurance;
    medicaidNumber : Text;
    medicareNumber : Text;
    responsiblePersons : [ResponsiblePerson];
    medications : [Medication];
    marRecords : [MedicationAdministrationRecord];
    adlRecords : [ADLRecord];
    dailyVitals : [DailyVitals];
    weightLog : [WeightEntry];
    dischargeTimestamp : ?Int;
    isArchived : Bool;
  };

  type ResidentStatus = { #active; #discharged };
  type RoomType = { #solo; #sharedRoom };

  type Physician = {
    id : Nat;
    name : Text;
    contactNumber : Text;
    specialty : Text;
  };

  type Pharmacy = {
    id : Nat;
    name : Text;
    address : Text;
    contactNumber : Text;
  };

  type Insurance = {
    id : Nat;
    companyName : Text;
    policyNumber : Text;
    address : Text;
    contactNumber : Text;
  };

  type ResponsiblePerson = {
    id : Nat;
    name : Text;
    relationship : Text;
    contactNumber : Text;
    address : Text;
  };

  type MedicationStatus = {
    #active;
    #discontinued;
  };

  type AdministrationRoute = {
    #oral;
    #injection;
    #topical;
    #inhaled;
    #sublingual;
    #rectal;
    #transdermal;
    #intravenous;
    #intramuscular;
    #subcutaneous;
    #ophthalmic;
  };

  type Medication = {
    id : Nat;
    name : Text;
    dosage : Text;
    administrationTimes : [Text];
    prescribingPhysician : ?Physician;
    administrationRoute : AdministrationRoute;
    dosageQuantity : Text;
    notes : Text;
    status : MedicationStatus;
  };

  type MedicationAdministrationRecord = {
    id : Nat;
    medication : Medication;
    administrationTime : Int;
    administeredBy : Text;
    notes : Text;
  };

  type ADLRecord = {
    id : Nat;
    residentId : Nat;
    date : Int;
    activity : Text;
    assistanceLevel : Text;
    staffNotes : Text;
  };

  type DailyVitals = {
    id : Nat;
    residentId : Nat;
    temperature : Float;
    bloodPressureSystolic : Nat;
    bloodPressureDiastolic : Nat;
    pulseRate : Nat;
    respiratoryRate : Nat;
    oxygenSaturation : Nat;
    bloodGlucose : ?Nat;
    measurementDateTime : Int;
    notes : Text;
  };

  type WeightEntry = {
    id : Nat;
    residentId : Nat;
    weight : Float;
    weightUnit : Text;
    measurementDate : Int;
    notes : Text;
  };

  type UserProfile = {
    name : Text;
    employeeId : Text;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    residents : Map.Map<Nat, Resident>;
    physicians : Map.Map<Nat, Physician>;
    pharmacies : Map.Map<Nat, Pharmacy>;
    insuranceCompanies : Map.Map<Nat, Insurance>;
    responsiblePersons : Map.Map<Nat, ResponsiblePerson>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextResidentId : Nat;
    nextPhysicianId : Nat;
    nextPharmacyId : Nat;
    nextInsuranceId : Nat;
    nextResponsiblePersonId : Nat;
    nextMedicationId : Nat;
    nextMarId : Nat;
    nextAdlId : Nat;
    nextDailyVitalsId : Nat;
    nextWeightEntryId : Nat;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    residents : Map.Map<Nat, Resident>;
    physicians : Map.Map<Nat, Physician>;
    pharmacies : Map.Map<Nat, Pharmacy>;
    insuranceCompanies : Map.Map<Nat, Insurance>;
    responsiblePersons : Map.Map<Nat, ResponsiblePerson>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextResidentId : Nat;
    nextPhysicianId : Nat;
    nextPharmacyId : Nat;
    nextInsuranceId : Nat;
    nextResponsiblePersonId : Nat;
    nextMedicationId : Nat;
    nextMarId : Nat;
    nextAdlId : Nat;
    nextDailyVitalsId : Nat;
    nextWeightEntryId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    // Migration preserves existing state
    // Admin initialization is handled during actor creation, not in this migration
    old;
  };
};
