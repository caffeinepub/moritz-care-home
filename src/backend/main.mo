import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Hardcoded permanent administrator principal
  let HARDCODED_ADMIN : Principal = Principal.fromText("hrxqg-aty7r-ze5hr-pldpb-ool7h-fy2rn-npy5t-lvtmr-lccbl-bdj53-pae");

  type UserProfile = {
    name : Text;
    employeeId : Text;
  };

  type UserProfileWithRole = {
    name : Text;
    role : Text;
    employeeId : Text;
  };

  public type Resident = {
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

  public type ResidentStatus = { #active; #discharged };
  public type RoomType = { #solo; #sharedRoom };

  module Resident {
    public func compareByRoomNumber(r1 : Resident, r2 : Resident) : Order.Order {
      compareRoomNumbers(r1.roomNumber, r2.roomNumber);
    };

    public func compareByBed(r1 : Resident, r2 : Resident) : Order.Order {
      let roomCompare = compareRoomNumbers(r1.roomNumber, r2.roomNumber);
      if (roomCompare != #equal) { return roomCompare };

      switch (r1.bed, r2.bed) {
        case (null, ?_) { #less };
        case (?_, null) { #greater };
        case (null, null) { #equal };
        case (?bed1, ?bed2) { Text.compare(bed1, bed2) };
      };
    };

    public func compareById(r1 : Resident, r2 : Resident) : Order.Order {
      Nat.compare(r1.id, r2.id);
    };

    public func compareByName(r1 : Resident, r2 : Resident) : Order.Order {
      let lastNameCompare = Text.compare(r1.lastName, r2.lastName);
      if (lastNameCompare != #equal) { return lastNameCompare };
      Text.compare(r1.firstName, r2.firstName);
    };

    func compareRoomNumbers(r1 : Text, r2 : Text) : Order.Order {
      let r1Nat = Nat.fromText(r1);
      let r2Nat = Nat.fromText(r2);
      switch (r1Nat, r2Nat) {
        case (?n1, ?n2) { Nat.compare(n1, n2) };
        case (?_, null) { #less };
        case (null, ?_) { #greater };
        case (null, null) { Text.compare(r1, r2) };
      };
    };
  };

  public type Physician = {
    id : Nat;
    name : Text;
    contactNumber : Text;
    specialty : Text;
  };

  module Physician {
    func toComparer(physician : Physician) : Text {
      physician.name;
    };
    public func compareByName(p1 : Physician, p2 : Physician) : Order.Order {
      Text.compare(toComparer(p1), toComparer(p2));
    };
  };

  public type MedicationStatus = {
    #active;
    #discontinued;
  };

  public type AdministrationRoute = {
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

  public type Medication = {
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

  module Medication {
    public func compareByName(m1 : Medication, m2 : Medication) : Order.Order {
      Text.compare(m1.name, m2.name);
    };
  };

  public type Pharmacy = {
    id : Nat;
    name : Text;
    address : Text;
    contactNumber : Text;
  };

  public type Insurance = {
    id : Nat;
    companyName : Text;
    policyNumber : Text;
    address : Text;
    contactNumber : Text;
  };

  public type ResponsiblePerson = {
    id : Nat;
    name : Text;
    relationship : Text;
    contactNumber : Text;
    address : Text;
  };

  public type MedicationAdministrationRecord = {
    id : Nat;
    medication : Medication;
    administrationTime : Int;
    administeredBy : Text;
    notes : Text;
  };

  public type ADLRecord = {
    id : Nat;
    residentId : Nat;
    date : Int;
    activity : Text;
    assistanceLevel : Text;
    staffNotes : Text;
  };

  public type DailyVitals = {
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

  public type WeightEntry = {
    id : Nat;
    residentId : Nat;
    weight : Float;
    weightUnit : Text;
    measurementDate : Int;
    notes : Text;
  };

  public type SortCriteria = {
    #residentId;
    #roomNumber;
    #bed;
    #name;
  };

  module SortCriteria {
    public func compare(c1 : SortCriteria, c2 : SortCriteria) : Nat {
      switch (c1, c2) {
        case (#residentId, #residentId) { 0 };
        case (#roomNumber, #roomNumber) { 0 };
        case (#bed, #bed) { 0 };
        case (#residentId, _) { 1 };
        case (#roomNumber, _) { 1 };
        case (#bed, _) { 1 };
        case (#name, #name) { 0 };
        case (#name, _) { 1 };
      };
    };
  };

  let residents = Map.empty<Nat, Resident>();
  let physicians = Map.empty<Nat, Physician>();
  let pharmacies = Map.empty<Nat, Pharmacy>();
  let insuranceCompanies = Map.empty<Nat, Insurance>();
  let responsiblePersons = Map.empty<Nat, ResponsiblePerson>();
  let userProfiles = Map.empty<Principal, UserProfileWithRole>();

  var nextResidentId = 1;
  var nextPhysicianId = 1;
  var nextPharmacyId = 1;
  var nextInsuranceId = 1;
  var nextResponsiblePersonId = 1;
  var nextMedicationId = 1;
  var nextMarId = 1;
  var nextAdlId = 1;
  var nextDailyVitalsId = 1;
  var nextWeightEntryId = 1;

  // Return a result for missing profile to not break hardcoded admin
  public type ProfileSetupError = { #NotFound };

  public query ({ caller }) func getUserProfileWithRole(_user : Principal) : async {
    #ok : UserProfileWithRole;
    #err : ProfileSetupError;
  } {
    let userProfile = userProfiles.get(_user);
    switch (userProfile) {
      case (null) { #err(#NotFound) };
      case (?profile) { #ok(profile) };
    };
  };

  // Support function for original users authentication shared({ caller })
  public shared ({ caller }) func ensureRegisteredUser() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot be registered");
    };
    // Auto-register the hardcoded admin principal unconditionally
    if (caller == HARDCODED_ADMIN) {
      // Ensure a default profile exists so the frontend never gets undefined baseline access
      switch (userProfiles.get(caller)) {
        case (null) {
          userProfiles.add(caller, {
            name = "Administrator";
            role = "admin";
            employeeId = "ADMIN";
          });
        };
        case (?_) {};
      };
      // Ensure the hardcoded admin has admin role via AccessControl
      AccessControl.initialize(accessControlState, caller, "", "");
      return;
    };
    // For all other principals, standard registration flow applies
  };

  public query ({ caller }) func healthCheck() : async {
    message : Text;
    timestamp : ?Int;
  } {
    {
      message = "Ok";
      timestamp = ?Time.now();
    };
  };

  func filterNonArchived(residentsList : [Resident]) : [Resident] {
    residentsList.filter(func(resident) { not resident.isArchived });
  };

  public shared ({ caller }) func addResidentAccessControl(
    firstName : Text,
    lastName : Text,
    dateOfBirth : Int,
    admissionDate : Int,
    roomNumber : Text,
    roomType : RoomType,
    bed : ?Text,
    physiciansData : [Physician],
    pharmacyData : ?Pharmacy,
    insuranceData : ?Insurance,
    medicaidNumber : Text,
    medicareNumber : Text,
    responsiblePersonsData : [ResponsiblePerson],
    medications : [Medication],
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add residents");
    };

    let resident : Resident = {
      id = nextResidentId;
      firstName;
      lastName;
      dateOfBirth;
      admissionDate;
      status = #active;
      roomNumber;
      roomType;
      bed;
      physicians = physiciansData;
      pharmacy = pharmacyData;
      insurance = insuranceData;
      medicaidNumber;
      medicareNumber;
      responsiblePersons = responsiblePersonsData;
      medications;
      marRecords = [];
      adlRecords = [];
      dailyVitals = [];
      weightLog = [];
      dischargeTimestamp = null;
      isArchived = false;
    };

    residents.add(nextResidentId, resident);
    nextResidentId += 1;
  };
};

