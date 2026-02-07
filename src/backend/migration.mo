import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";

module {
  type Resident = {
    id : Nat;
    firstName : Text;
    lastName : Text;
    dateOfBirth : Int;
    admissionDate : Int;
    status : { #active; #discharged };
    roomNumber : Text;
    roomType : { #solo; #sharedRoom };
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
  };

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

  type Medication = {
    id : Nat;
    name : Text;
    dosage : Text;
    administrationTimes : [Text];
    prescribingPhysician : ?Physician;
    administrationRoute : {
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
    dosageQuantity : Text;
    notes : Text;
    status : { #active; #discontinued };
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
    role : Text;
    employeeId : Text;
  };

  type OldActor = {
    residents : Map.Map<Nat, Resident>;
    nextResidentId : Nat;
    physicians : Map.Map<Nat, Physician>;
    nextPhysicianId : Nat;
    pharmacies : Map.Map<Nat, Pharmacy>;
    nextPharmacyId : Nat;
    insuranceCompanies : Map.Map<Nat, Insurance>;
    nextInsuranceId : Nat;
    responsiblePersons : Map.Map<Nat, ResponsiblePerson>;
    nextResponsiblePersonId : Nat;
    nextMedicationId : Nat;
    nextMarId : Nat;
    nextAdlId : Nat;
    nextDailyVitalsId : Nat;
    nextWeightEntryId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  type NewActor = OldActor;

  public func run(old : OldActor) : NewActor {
    let sanitizedResidents = old.residents.filter(
      func(_id, resident) { isValidResident(resident) }
    );
    { old with residents = sanitizedResidents };
  };

  func isValidResident(resident : Resident) : Bool {
    let updatedMeds = resident.medications.filter(
      func(med) {
        switch (med.status) {
          case (#active) { true };
          case (#discontinued) { true };
        };
      }
    );
    ignore updatedMeds;
    true;
  };
};
