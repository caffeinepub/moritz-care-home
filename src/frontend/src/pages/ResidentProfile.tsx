import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Edit,
  FileText,
  Heart,
  MapPin,
  Phone,
  Pill,
  Printer,
  RefreshCw,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { Medication } from "../backend";
import AddAdlRecordDialog from "../components/AddAdlRecordDialog";
import AddDailyVitalsDialog from "../components/AddDailyVitalsDialog";
import AddMarRecordDialog from "../components/AddMarRecordDialog";
import AddMedicationDialog from "../components/AddMedicationDialog";
import AddWeightEntryDialog from "../components/AddWeightEntryDialog";
import EditMedicationDialog from "../components/EditMedicationDialog";
import EditResidentDialog from "../components/EditResidentDialog";
import { useGetResident, useIsCallerAdmin } from "../hooks/useQueries";
import { calculateAge, formatDate } from "../lib/dateUtils";

export default function ResidentProfile() {
  const { residentId } = useParams({ from: "/resident/$residentId" });
  const navigate = useNavigate();
  // useGetResident expects number
  const residentIdNum = Number(residentId);

  const {
    data: resident,
    isLoading,
    error,
    refetch: refetchResident,
  } = useGetResident(residentIdNum);

  const {
    data: isAdmin,
    isLoading: adminLoading,
    refetch: refetchAdmin,
  } = useIsCallerAdmin();

  const [selectedMedication, setSelectedMedication] =
    useState<Medication | null>(null);
  const [includeSignature, setIncludeSignature] = useState(false);

  const handlePrint = () => window.print();

  const handleEditMedication = (medication: Medication) => {
    setSelectedMedication(medication);
  };

  const handleRetry = () => {
    refetchResident();
    refetchAdmin();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-48 rounded bg-muted" />
            <div className="h-48 rounded bg-muted" />
            <div className="h-48 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">
                Error Loading Resident
              </h3>
              <p className="mt-1 text-sm text-destructive/90">
                {error.message || "Failed to load resident information"}
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleRetry} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
                <Button
                  onClick={() => navigate({ to: "/" })}
                  variant="outline"
                  size="sm"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border p-4">
          <p>Resident not found</p>
          <Button onClick={() => navigate({ to: "/" })} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const age = calculateAge(resident.dateOfBirth);
  const initials = `${resident.firstName[0]}${resident.lastName[0]}`;
  const activeMedications = resident.medications.filter(
    (m) => String(m.status) === "active",
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {resident.firstName} {resident.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Room {resident.roomNumber}
                {resident.bed && ` - Bed ${resident.bed}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="signature-mode"
              checked={includeSignature}
              onCheckedChange={setIncludeSignature}
            />
            <Label htmlFor="signature-mode">Include signature lines</Label>
          </div>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {!adminLoading && isAdmin && (
            <EditResidentDialog resident={resident}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </EditResidentDialog>
          )}
        </div>
      </div>

      {/* Resident Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Resident Information
            </CardTitle>
            <Badge
              variant={resident.status === "active" ? "default" : "secondary"}
            >
              {resident.status === "active" ? "Active" : "Discharged"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">
                {resident.firstName} {resident.lastName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{formatDate(resident.dateOfBirth)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="font-medium">{age} years</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Admission Date</p>
              <p className="font-medium">
                {formatDate(resident.admissionDate)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Room Number</p>
              <p className="font-medium">
                {resident.roomNumber}
                {resident.bed && ` - Bed ${resident.bed}`}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Room Type</p>
              <p className="font-medium">
                {resident.roomType === "solo" ? "Solo" : "Shared Room"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Medicaid Number</p>
              <p className="font-medium">{resident.medicaidNumber || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Medicare Number</p>
              <p className="font-medium">{resident.medicareNumber || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Three Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4" />
              Assigned Physicians
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resident.physicians.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No physicians assigned
              </p>
            ) : (
              <div className="space-y-3">
                {resident.physicians.map((physician) => (
                  <div key={String(physician.id)} className="space-y-1">
                    <p className="font-medium">{physician.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {physician.specialty}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {physician.contactNumber}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Pharmacy Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!resident.pharmacy ? (
              <p className="text-sm text-muted-foreground">
                No pharmacy assigned
              </p>
            ) : (
              <div className="space-y-2">
                <p className="font-medium">{resident.pharmacy.name}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {resident.pharmacy.address}
                </p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {resident.pharmacy.contactNumber}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Responsible Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resident.responsiblePersons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contacts assigned
              </p>
            ) : (
              <div className="space-y-3">
                {resident.responsiblePersons.map((person) => (
                  <div key={String(person.id)} className="space-y-1">
                    <p className="font-medium">{person.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {person.relationship}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {person.contactNumber}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insurance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Insurance Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!resident.insurance ? (
            <p className="text-sm text-muted-foreground">
              No insurance information available
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="font-medium">{resident.insurance.companyName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Policy Number</p>
                <p className="font-medium">{resident.insurance.policyNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{resident.insurance.address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contact Number</p>
                <p className="font-medium">
                  {resident.insurance.contactNumber}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="medications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="medications" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Medications
            <Badge variant="secondary">{activeMedications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Daily Vitals
          </TabsTrigger>
          <TabsTrigger value="mar" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            MAR
          </TabsTrigger>
          <TabsTrigger value="adl" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            ADL
          </TabsTrigger>
          <TabsTrigger value="weight" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Weight Log
          </TabsTrigger>
        </TabsList>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          <div className="flex justify-between print:hidden">
            <h3 className="text-lg font-semibold">Active Medications</h3>
            {!adminLoading && isAdmin && (
              <AddMedicationDialog resident={resident}>
                <Button>
                  <Pill className="mr-2 h-4 w-4" />
                  Add Medication
                </Button>
              </AddMedicationDialog>
            )}
          </div>
          {activeMedications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pill className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No active medications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeMedications.map((medication) => (
                <Card key={String(medication.id)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {medication.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {medication.dosage}
                        </p>
                      </div>
                      <Badge>{String(medication.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">
                        Administration Times:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {medication.administrationTimes.join(", ")}
                      </p>
                    </div>
                    {medication.prescribingPhysician && (
                      <div>
                        <p className="text-sm font-medium">
                          Prescribing Physician:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {medication.prescribingPhysician.name}
                        </p>
                      </div>
                    )}
                    {medication.notes && (
                      <div>
                        <p className="text-sm font-medium">Notes:</p>
                        <p className="text-sm text-muted-foreground">
                          {medication.notes}
                        </p>
                      </div>
                    )}
                    {!adminLoading && isAdmin && (
                      <EditMedicationDialog
                        resident={resident}
                        medication={medication}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMedication(medication)}
                          className="mt-2 w-full"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Medication
                        </Button>
                      </EditMedicationDialog>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Daily Vitals Tab */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="flex justify-between print:hidden">
            <h3 className="text-lg font-semibold">Daily Vitals</h3>
            {!adminLoading && isAdmin && (
              <AddDailyVitalsDialog resident={resident}>
                <Button>
                  <Activity className="mr-2 h-4 w-4" />
                  Record Vitals
                </Button>
              </AddDailyVitalsDialog>
            )}
          </div>
          {resident.dailyVitals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No vitals recorded</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {[...resident.dailyVitals].reverse().map((vitals) => (
                <Card key={String(vitals.id)}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {formatDate(vitals.measurementDateTime)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Temperature</p>
                        <p className="font-medium">
                          {vitals.temperature.toFixed(1)}°C
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Blood Pressure</p>
                        <p className="font-medium">
                          {vitals.bloodPressureSystolic}/
                          {vitals.bloodPressureDiastolic} mmHg
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pulse Rate</p>
                        <p className="font-medium">{vitals.pulseRate} bpm</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Respiratory Rate
                        </p>
                        <p className="font-medium">
                          {vitals.respiratoryRate} /min
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">O₂ Saturation</p>
                        <p className="font-medium">
                          {vitals.oxygenSaturation}%
                        </p>
                      </div>
                      {vitals.bloodGlucose != null && (
                        <div>
                          <p className="text-muted-foreground">Blood Glucose</p>
                          <p className="font-medium">
                            {vitals.bloodGlucose} mg/dL
                          </p>
                        </div>
                      )}
                    </div>
                    {vitals.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {vitals.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MAR Tab */}
        <TabsContent value="mar" className="space-y-4">
          <div className="flex justify-between print:hidden">
            <h3 className="text-lg font-semibold">
              Medication Administration Records
            </h3>
            {!adminLoading && isAdmin && (
              <AddMarRecordDialog resident={resident}>
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Add MAR Record
                </Button>
              </AddMarRecordDialog>
            )}
          </div>
          {resident.marRecords.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No MAR records</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...resident.marRecords].reverse().map((record) => (
                <Card key={String(record.id)}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{record.medication.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.medication.dosage} —{" "}
                          {String(record.medication.administrationRoute)}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{formatDate(record.administrationTime)}</p>
                        <p>By: {record.administeredBy}</p>
                      </div>
                    </div>
                    {record.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {record.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ADL Tab */}
        <TabsContent value="adl" className="space-y-4">
          <div className="flex justify-between print:hidden">
            <h3 className="text-lg font-semibold">
              Activities of Daily Living
            </h3>
            {!adminLoading && isAdmin && (
              <AddAdlRecordDialog resident={resident}>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  Add ADL Record
                </Button>
              </AddAdlRecordDialog>
            )}
          </div>
          {resident.adlRecords.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No ADL records</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...resident.adlRecords].reverse().map((record) => (
                <Card key={String(record.id)}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{record.activity}</p>
                        <p className="text-sm text-muted-foreground">
                          Assistance: {record.assistanceLevel}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(record.date)}
                      </p>
                    </div>
                    {record.staffNotes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {record.staffNotes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Weight Log Tab */}
        <TabsContent value="weight" className="space-y-4">
          <div className="flex justify-between print:hidden">
            <h3 className="text-lg font-semibold">Weight Log</h3>
            {!adminLoading && isAdmin && (
              <AddWeightEntryDialog resident={resident}>
                <Button>
                  <Activity className="mr-2 h-4 w-4" />
                  Add Weight Entry
                </Button>
              </AddWeightEntryDialog>
            )}
          </div>
          {resident.weightLog.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No weight entries</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...resident.weightLog].reverse().map((entry) => (
                <Card key={String(entry.id)}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {entry.weight} {entry.weightUnit}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(entry.measurementDate)}
                      </p>
                    </div>
                    {entry.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {entry.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Keep selectedMedication in scope to avoid unused warning */}
      {selectedMedication && null}
    </div>
  );
}
