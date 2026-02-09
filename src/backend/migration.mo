import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type Resident = {
    id : Nat;
    firstName : Text;
    lastName : Text;
    dateOfBirth : Int;
    admissionDate : Int;
    status : {
      #active;
      #discharged;
    };
    roomNumber : Text;
    roomType : {
      #solo;
      #sharedRoom;
    };
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
    status : {
      #active;
      #discontinued;
    };
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
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  type NewActor = {
    residents : Map.Map<Nat, Resident>;
    nextResidentId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    // No data transformations needed
    old;
  };
};
