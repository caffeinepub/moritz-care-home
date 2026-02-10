import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import List "mo:core/List";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

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
      if (roomCompare != #equal) {
        return roomCompare;
      };

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

  public type UserProfile = {
    name : Text;
    employeeId : Text;
  };

  public type UserProfileWithRole = {
    name : Text;
    role : Text;
    employeeId : Text;
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

  // Persistent State
  let residents = Map.empty<Nat, Resident>();
  let physicians = Map.empty<Nat, Physician>();
  let pharmacies = Map.empty<Nat, Pharmacy>();
  let insuranceCompanies = Map.empty<Nat, Insurance>();
  let responsiblePersons = Map.empty<Nat, ResponsiblePerson>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ID Counters
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

  // Archive Helper - now as a shared function that can be called periodically
  public shared ({ caller }) func autoArchiveDischargedResidents() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can trigger auto-archive");
    };

    let now = Time.now();
    let archiveThreshold : Int = 30 * 24 * 60 * 60 * 1_000_000_000;

    let archivedResidents = residents.map<Nat, Resident, Resident>(
      func(_id, resident) {
        switch (resident.status, resident.dischargeTimestamp) {
          case (#discharged, ?dischargeTime) {
            if (now - dischargeTime > archiveThreshold) {
              { resident with isArchived = true };
            } else { resident };
          };
          case (_, _) { resident };
        };
      }
    );

    residents.clear();
    let archivedEntries = archivedResidents.entries();
    for ((id, resident) in archivedEntries) {
      residents.add(id, resident);
    };
  };

  // Helper function to filter non-archived residents (read-only)
  func filterNonArchived(residentsList : [Resident]) : [Resident] {
    residentsList.filter(func(resident) { not resident.isArchived });
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Resident Management
  public shared ({ caller }) func addResident(
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
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
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

  public shared ({ caller }) func updateResident(
    id : Nat,
    firstName : Text,
    lastName : Text,
    dateOfBirth : Int,
    admissionDate : Int,
    status : ResidentStatus,
    roomNumber : Text,
    roomType : RoomType,
    bed : ?Text,
    physicians : [Physician],
    pharmacy : ?Pharmacy,
    insurance : ?Insurance,
    medicaidNumber : Text,
    medicareNumber : Text,
    responsiblePersons : [ResponsiblePerson],
    medications : [Medication],
  ) : async Resident {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update residents");
    };

    let existing = switch (residents.get(id)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };

    let updatedResident = { existing with
      firstName;
      lastName;
      dateOfBirth;
      admissionDate;
      status;
      roomNumber;
      roomType;
      bed;
      physicians;
      pharmacy;
      insurance;
      medicaidNumber;
      medicareNumber;
      responsiblePersons;
      medications;
    };

    residents.add(id, updatedResident);
    updatedResident;
  };

  public shared ({ caller }) func dischargeResident(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can discharge residents");
    };

    let existing = switch (residents.get(id)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };

    let updatedResident : Resident = {
      existing with
      status = #discharged;
      dischargeTimestamp = ?Time.now();
    };

    residents.add(id, updatedResident);
  };

  public shared ({ caller }) func archiveResident(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can archive residents");
    };

    let existing = switch (residents.get(id)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };

    let updatedResident : Resident = { existing with isArchived = true };
    residents.add(id, updatedResident);
  };

  public shared ({ caller }) func permanentlyDeleteResident(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can permanently delete residents");
    };

    let exists = switch (residents.get(id)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?_resident) { true };
    };

    if (exists) {
      residents.remove(id);
    };
  };

  public query ({ caller }) func getResident(id : Nat) : async ?Resident {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view residents");
    };
    switch (residents.get(id)) {
      case (?resident) { if (not resident.isArchived) { return ?resident } };
      case (null) {};
    };
    null;
  };

  public query ({ caller }) func getAllResidents() : async [Resident] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view residents");
    };
    sortResidentsByBed(
      filterNonArchived(residents.values().toArray())
    );
  };

  public query ({ caller }) func getResidentsByRoom(roomNumber : Text) : async [Resident] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view residents");
    };
    sortResidentsByBed(
      residents.values().toArray().filter(
        func(r) { r.roomNumber == roomNumber and not r.isArchived }
      )
    );
  };

  public query ({ caller }) func getActiveResidents() : async [Resident] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view residents");
    };
    sortResidentsByBed(
      residents.values().toArray().filter(
        func(r) { r.status == #active and not r.isArchived }
      )
    );
  };

  public query ({ caller }) func getDischargedResidents() : async [Resident] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view residents");
    };
    sortResidentsByBed(
      residents.values().toArray().filter(
        func(r) { r.status == #discharged and not r.isArchived }
      )
    );
  };

  public query ({ caller }) func getResidentsByRoomType(roomType : RoomType) : async [Resident] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view residents");
    };
    sortResidentsByBed(
      residents.values().toArray().filter(
        func(r) { r.roomType == roomType and not r.isArchived }
      )
    );
  };

  // Physician Management

  public shared ({ caller }) func addPhysician(
    name : Text,
    contactNumber : Text,
    specialty : Text
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add physicians");
    };

    let physician : Physician = {
      id = nextPhysicianId;
      name;
      contactNumber;
      specialty;
    };

    physicians.add(nextPhysicianId, physician);
    nextPhysicianId += 1;
  };

  public query ({ caller }) func getAllPhysicians() : async [Physician] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view physicians");
    };
    physicians.values().toArray();
  };

  public query ({ caller }) func getPhysician(id : Nat) : async ?Physician {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view physicians");
    };
    physicians.get(id);
  };

  // Pharmacy Management
  public shared ({ caller }) func addPharmacy(
    name : Text,
    address : Text,
    contactNumber : Text
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add pharmacies");
    };

    let pharmacy : Pharmacy = {
      id = nextPharmacyId;
      name;
      address;
      contactNumber;
    };

    pharmacies.add(nextPharmacyId, pharmacy);
    nextPharmacyId += 1;
  };

  public query ({ caller }) func getAllPharmacies() : async [Pharmacy] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view pharmacies");
    };
    pharmacies.values().toArray();
  };

  public query ({ caller }) func getPharmacy(id : Nat) : async ?Pharmacy {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view pharmacies");
    };
    pharmacies.get(id);
  };

  // Insurance Management
  public shared ({ caller }) func addInsurance(
    companyName : Text,
    policyNumber : Text,
    address : Text,
    contactNumber : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add insurance companies");
    };

    let insurance : Insurance = {
      id = nextInsuranceId;
      companyName;
      policyNumber;
      address;
      contactNumber;
    };

    insuranceCompanies.add(nextInsuranceId, insurance);
    nextInsuranceId += 1;
  };

  public query ({ caller }) func getAllInsuranceCompanies() : async [Insurance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view insurance companies");
    };
    insuranceCompanies.values().toArray();
  };

  public query ({ caller }) func getInsurance(id : Nat) : async ?Insurance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view insurance companies");
    };
    insuranceCompanies.get(id);
  };

  // Responsible Person Management
  public shared ({ caller }) func addResponsiblePerson(
    name : Text,
    relationship : Text,
    contactNumber : Text,
    address : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add responsible persons");
    };

    let person : ResponsiblePerson = {
      id = nextResponsiblePersonId;
      name;
      relationship;
      contactNumber;
      address;
    };

    responsiblePersons.add(nextResponsiblePersonId, person);
    nextResponsiblePersonId += 1;
  };

  public query ({ caller }) func getAllResponsiblePersons() : async [ResponsiblePerson] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view responsible persons");
    };
    responsiblePersons.values().toArray();
  };

  public query ({ caller }) func getResponsiblePerson(id : Nat) : async ?ResponsiblePerson {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view responsible persons");
    };
    responsiblePersons.get(id);
  };

  // Medication Management
  public shared ({ caller }) func addMedication(
    residentId : Nat,
    name : Text,
    dosage : Text,
    administrationTimes : [Text],
    prescribingPhysician : ?Physician,
    administrationRoute : AdministrationRoute,
    dosageQuantity : Text,
    notes : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add medications");
    };

    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };

    let medication : Medication = {
      id = nextMedicationId;
      name;
      dosage;
      administrationTimes;
      prescribingPhysician;
      administrationRoute;
      notes;
      status = #active;
      dosageQuantity;
    };

    let updatedMedications = resident.medications.concat([medication]);
    let updatedResident : Resident = {
      resident with medications = updatedMedications;
    };

    residents.add(residentId, updatedResident);
    nextMedicationId += 1;
  };

  public shared ({ caller }) func updateMedicationStatus(
    residentId : Nat,
    medicationId : Nat,
    status : MedicationStatus,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can modify medication status");
    };

    let resident : Resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?r) { r };
    };

    let updatedMedications : [Medication] = resident.medications.map(
      func(med) {
        if (med.id == medicationId) {
          { med with status };
        } else {
          med;
        };
      }
    );

    let updatedResident : Resident = {
      resident with medications = updatedMedications;
    };
    residents.add(residentId, updatedResident);
  };

  public shared ({ caller }) func editMedication(
    residentId : Nat,
    medicationId : Nat,
    name : Text,
    dosage : Text,
    administrationTimes : [Text],
    prescribingPhysician : ?Physician,
    administrationRoute : AdministrationRoute,
    dosageQuantity : Text,
    notes : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can edit medications");
    };

    let resident : Resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?r) { r };
    };

    let updatedMedications : [Medication] = resident.medications.map(
      func(med) {
        if (med.id == medicationId) {
          {
            med with
            name;
            dosage;
            administrationTimes;
            prescribingPhysician;
            administrationRoute;
            dosageQuantity;
            notes;
          };
        } else { med };
      }
    );

    let updatedResident : Resident = {
      resident with medications = updatedMedications;
    };
    residents.add(residentId, updatedResident);
  };

  public shared ({ caller }) func updateMedication(
    residentId : Nat,
    medicationId : Nat,
    name : Text,
    dosage : Text,
    administrationTimes : [Text],
    prescribingPhysician : ?Physician,
    administrationRoute : AdministrationRoute,
    dosageQuantity : Text,
    notes : Text,
    status : MedicationStatus,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update medications");
    };

    let resident : Resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?r) { r };
    };

    let updatedMedications : [Medication] = resident.medications.map(
      func(med) {
        if (med.id == medicationId) {
          {
            med with
            name;
            dosage;
            administrationTimes;
            prescribingPhysician;
            administrationRoute;
            dosageQuantity;
            notes;
            status;
          };
        } else { med };
      }
    );

    let updatedResident : Resident = {
      resident with medications = updatedMedications;
    };
    residents.add(residentId, updatedResident);
  };

  // MAR Records Management
  public shared ({ caller }) func addMarRecord(
    residentId : Nat,
    medication : Medication,
    administrationTime : Int,
    administeredBy : Text,
    notes : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add MAR records");
    };

    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };

    let marRecord : MedicationAdministrationRecord = {
      id = nextMarId;
      medication;
      administrationTime;
      administeredBy;
      notes;
    };

    let updatedMarRecords = resident.marRecords.concat([marRecord]);
    let updatedResident : Resident = {
      resident with marRecords = updatedMarRecords;
    };

    residents.add(residentId, updatedResident);
    nextMarId += 1;
  };

  // ADL Records
  public shared ({ caller }) func addAdlRecord(
    residentId : Nat,
    date : Int,
    activity : Text,
    assistanceLevel : Text,
    staffNotes : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add ADL records");
    };

    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };

    let adlRecord : ADLRecord = {
      id = nextAdlId;
      residentId;
      date;
      activity;
      assistanceLevel;
      staffNotes;
    };

    let updatedAdlRecords = resident.adlRecords.concat([adlRecord]);
    let updatedResident : Resident = {
      resident with adlRecords = updatedAdlRecords;
    };

    residents.add(residentId, updatedResident);
    nextAdlId += 1;
  };

  // Daily Vitals
  public shared ({ caller }) func addDailyVitals(
    residentId : Nat,
    temperature : Float,
    bloodPressureSystolic : Nat,
    bloodPressureDiastolic : Nat,
    pulseRate : Nat,
    respiratoryRate : Nat,
    oxygenSaturation : Nat,
    bloodGlucose : ?Nat,
    measurementDateTime : Int,
    notes : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add daily vitals");
    };

    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };

    let vitals : DailyVitals = {
      id = nextDailyVitalsId;
      residentId;
      temperature;
      bloodPressureSystolic;
      bloodPressureDiastolic;
      pulseRate;
      respiratoryRate;
      oxygenSaturation;
      bloodGlucose;
      measurementDateTime;
      notes;
    };

    let updatedDailyVitals = resident.dailyVitals.concat([vitals]);
    let updatedResident : Resident = {
      resident with dailyVitals = updatedDailyVitals;
    };

    residents.add(residentId, updatedResident);
    nextDailyVitalsId += 1;
  };

  public query ({ caller }) func getDailyVitals(residentId : Nat) : async [DailyVitals] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view daily vitals");
    };
    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };
    resident.dailyVitals;
  };

  // Weight Entries
  public shared ({ caller }) func addWeightEntry(
    residentId : Nat,
    weight : Float,
    weightUnit : Text,
    measurementDate : Int,
    notes : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add weight entries");
    };

    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };

    let weightEntry : WeightEntry = {
      id = nextWeightEntryId;
      residentId;
      weight;
      weightUnit;
      measurementDate;
      notes;
    };

    let updatedWeightLog = resident.weightLog.concat([weightEntry]);
    let updatedResident : Resident = {
      resident with weightLog = updatedWeightLog;
    };

    residents.add(residentId, updatedResident);
    nextWeightEntryId += 1;
  };

  public query ({ caller }) func getWeightLog(residentId : Nat) : async [WeightEntry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view weight log");
    };
    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };
    resident.weightLog;
  };

  // Report Generation
  public query ({ caller }) func generateMarReport(residentId : Nat) : async [MedicationAdministrationRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can generate reports");
    };
    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };
    resident.marRecords;
  };

  public query ({ caller }) func generateAdlReport(residentId : Nat) : async [ADLRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can generate reports");
    };
    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };
    resident.adlRecords;
  };

  public query ({ caller }) func generateMedicationReport(residentId : Nat) : async [Medication] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can generate reports");
    };
    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };
    let filtered = resident.medications.filter(
      func(m) { m.status == #active }
    );
    filtered.sort(Medication.compareByName);
  };

  public query ({ caller }) func generateFullMedicationReport(residentId : Nat) : async [Medication] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can generate reports");
    };
    let resident = switch (residents.get(residentId)) {
      case (null) { Runtime.trap("Resident not found") };
      case (?resident) { resident };
    };
    resident.medications.sort(Medication.compareByName);
  };

  public query ({ caller }) func generateResidentProfileReport(residentId : Nat) : async ?Resident {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can generate reports");
    };
    residents.get(residentId);
  };

  // Utility Functions

  public query ({ caller }) func calculateAge(_dateOfBirth : Int) : async Int {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can calculate age");
    };
    let now = Time.now();
    let ageInNanoseconds = now;
    let nanosecondsInYear = 365 * 24 * 60 * 60 * 1_000_000_000;
    let age = ageInNanoseconds / nanosecondsInYear;
    age;
  };

  public query ({ caller }) func getFilteredAndSortedResidents(status : ?ResidentStatus, sortBy : ?SortCriteria) : async [Resident] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view residents");
    };

    var filteredResidents = residents.values().toArray();

    switch (status) {
      case (null) {};
      case (?residentStatus) {
        filteredResidents := filteredResidents.filter(
          func(r) { r.status == residentStatus }
        );
      };
    };

    let residentsToSort : [Resident] = filteredResidents;

    switch (sortBy) {
      case (null) { sortResidentsByBed(residentsToSort) };
      case (?criteria) {
        switch (criteria) {
          case (#residentId) { sortResidentsById(residentsToSort) };
          case (#roomNumber) { sortResidentsByRoomNumber(residentsToSort) };
          case (#bed) { sortResidentsByBed(residentsToSort) };
          case (#name) { sortResidentsByName(residentsToSort) };
        };
      };
    };
  };

  func sortResidentsByRoomNumber(residentsArray : [Resident]) : [Resident] {
    residentsArray.sort(Resident.compareByRoomNumber);
  };

  func sortResidentsByBed(residentsArray : [Resident]) : [Resident] {
    residentsArray.sort(Resident.compareByBed);
  };

  func sortResidentsById(residentsArray : [Resident]) : [Resident] {
    residentsArray.sort(Resident.compareById);
  };

  func sortResidentsByName(residentsArray : [Resident]) : [Resident] {
    residentsArray.sort(Resident.compareByName);
  };

  public query ({ caller : Principal }) func getAllRoomNumbers() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view room numbers");
    };
    residents.values().toArray().map(func(r) { r.roomNumber });
  };

  public query ({ caller : Principal }) func findResidentByRoom(roomNumber : Text) : async ?Resident {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search residents");
    };
    residents.values().toArray().find(func(r) { r.roomNumber == roomNumber });
  };

  public query ({ caller }) func getResidentCounts() : async {
    totalResidents : Nat;
    activeResidents : Nat;
    dischargedResidents : Nat;
    archivedResidents : Nat;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view resident counts");
    };

    var total = 0;
    var active = 0;
    var discharged = 0;
    var archived = 0;

    for ((_, resident) in residents.entries()) {
      total += 1;
      if (resident.isArchived) {
        archived += 1;
      } else {
        switch (resident.status) {
          case (#active) { active += 1 };
          case (#discharged) { discharged += 1 };
        };
      };
    };

    {
      totalResidents = total;
      activeResidents = active;
      dischargedResidents = discharged;
      archivedResidents = archived;
    };
  };

  public query ({ caller }) func getResidentRoomMap() : async [(Nat, Text)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view resident room map");
    };

    residents.toArray().map(
      func((id, resident)) { (id, resident.roomNumber) }
    );
  };

  public query ({ caller }) func getNonArchivedResidents() : async [Resident] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view residents");
    };
    residents.values().toArray().filter(
      func(r) { not r.isArchived }
    );
  };

  // Open function for public health check
  public query ({ caller }) func healthCheck() : async {
    message : Text;
    timestamp : ?Int;
  } {
    {
      message = "Backend is up and responding.";
      timestamp = ?Time.now();
    };
  };

  public query ({ caller }) func checkUpgradeHealth() : async {
    residents : Nat;
    userProfiles : Nat;
    nextResidentId : Nat;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can access upgrade health check");
    };
    {
      residents = residents.size();
      userProfiles = userProfiles.size();
      nextResidentId;
    };
  };

  // Admin-only comprehensive diagnostics endpoint
  public query ({ caller }) func getSystemDiagnostics(includeSample : Bool) : async {
    aggregateCounts : {
      totalResidents : Nat;
      activeResidents : Nat;
      dischargedResidents : Nat;
      archivedResidents : Nat;
    };
    nextIdCounters : {
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
    sampleData : ?[(Nat, Text)];
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can access system diagnostics");
    };

    var total = 0;
    var active = 0;
    var discharged = 0;
    var archived = 0;

    for ((_, resident) in residents.entries()) {
      total += 1;
      if (resident.isArchived) {
        archived += 1;
      } else {
        switch (resident.status) {
          case (#active) { active += 1 };
          case (#discharged) { discharged += 1 };
        };
      };
    };

    let sample : ?[(Nat, Text)] = if (includeSample) {
      let allResidents = residents.toArray();
      let sampleSize = Nat.min(10, allResidents.size());
      let sampleArray = Array.tabulate(
        sampleSize,
        func(i) {
          let (id, resident) = allResidents[i];
          (id, resident.roomNumber);
        }
      );
      ?sampleArray;
    } else {
      null;
    };

    {
      aggregateCounts = {
        totalResidents = total;
        activeResidents = active;
        dischargedResidents = discharged;
        archivedResidents = archived;
      };
      nextIdCounters = {
        nextResidentId;
        nextPhysicianId;
        nextPharmacyId;
        nextInsuranceId;
        nextResponsiblePersonId;
        nextMedicationId;
        nextMarId;
        nextAdlId;
        nextDailyVitalsId;
        nextWeightEntryId;
      };
      sampleData = sample;
    };
  };

  public query ({ caller }) func getResidentStatistics() : async {
    totalResidents : Nat;
    activeResidents : Nat;
    dischargedResidents : Nat;
    residentsByRoom : [(Nat, Text, Text)];
    residentsByRoomType : [(Nat, Text, RoomType)];
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view resident statistics");
    };

    var total = 0;
    var active = 0;
    var discharged = 0;
    let residentsByRoom = List.empty<(Nat, Text, Text)>();
    let residentsByRoomType = List.empty<(Nat, Text, RoomType)>();

    for ((_, resident) in residents.entries()) {
      total += 1;
      switch (resident.status) {
        case (#active) { active += 1 };
        case (#discharged) { discharged += 1 };
      };
      residentsByRoom.add((resident.id, resident.roomNumber, resident.firstName));
      residentsByRoomType.add((resident.id, resident.roomNumber, resident.roomType));
    };

    {
      totalResidents = total;
      activeResidents = active;
      dischargedResidents = discharged;
      residentsByRoom = residentsByRoom.toArray();
      residentsByRoomType = residentsByRoomType.toArray();
    };
  };

  // ---------------------------------
  // Version 105+ Compatibility Layer
  // ---------------------------------

  // Virtual 105 Compatibility Types (mirroring V105 actor)
  module v105 {
    public type ResidentStatus = {
      #active;
      #discharged;
    };

    public type RoomType = {
      #solo;
      #sharedRoom;
    };

    public type Resident = {
      id : Nat;
      firstName : Text;
      lastName : Text;
      dateOfBirth : Nat;
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
  };

  // Converts current Resident to "mirrored" V105 Resident
  func toV105Resident(resident : Resident) : v105.Resident {
    let status : v105.ResidentStatus = switch (resident.status) {
      case (#active) { #active };
      case (#discharged) { #discharged };
    };

    let roomType : v105.RoomType = switch (resident.roomType) {
      case (#solo) { #solo };
      case (#sharedRoom) { #sharedRoom };
    };

    { resident with
      status;
      roomType;
      dateOfBirth = if (resident.dateOfBirth < 0) {
        0;
      } else {
        resident.dateOfBirth.toNat();
      };
    };
  };

  // Helper function to convert array of residents to v105 Resident
  func toV105ResidentArray(residentsList : [Resident]) : [v105.Resident] {
    residentsList.map(toV105Resident);
  };

  // 105-compatibility discharge function
  public shared ({ caller }) func v105_dischargeResident(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can discharge residents");
    };
    await dischargeResident(id);
  };

  // 105-compatibility permanent delete function
  public shared ({ caller }) func v105_permanentlyDeleteResident(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can permanently delete residents");
    };
    await permanentlyDeleteResident(id);
  };
};
