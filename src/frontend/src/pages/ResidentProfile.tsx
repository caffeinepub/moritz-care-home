import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetResident, useIsCallerAdmin } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Printer,
  Edit,
  User,
  Phone,
  MapPin,
  Calendar,
  Pill,
  Activity,
  FileText,
  Heart,
  Building2,
  CreditCard,
  Users,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { formatDate, calculateAge } from '../lib/dateUtils';
import EditResidentDialog from '../components/EditResidentDialog';
import AddMedicationDialog from '../components/AddMedicationDialog';
import EditMedicationDialog from '../components/EditMedicationDialog';
import AddMarRecordDialog from '../components/AddMarRecordDialog';
import AddAdlRecordDialog from '../components/AddAdlRecordDialog';
import AddDailyVitalsDialog from '../components/AddDailyVitalsDialog';
import AddWeightEntryDialog from '../components/AddWeightEntryDialog';
import type { Medication } from '../backend';

/**
 * Resident profile page using resilient actor-based queries with proper loading states, error recovery with retry, and admin-gated Edit Profile button.
 */
export default function ResidentProfile() {
  const { residentId } = useParams({ from: '/resident/$residentId' });
  const navigate = useNavigate();
  const residentIdBigInt = BigInt(residentId);

  const { 
    data: resident, 
    isLoading, 
    error,
    refetch: refetchResident
  } = useGetResident(residentIdBigInt);
  
  const { 
    data: isAdmin, 
    isLoading: adminLoading,
    refetch: refetchAdmin
  } = useIsCallerAdmin();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMedicationOpen, setAddMedicationOpen] = useState(false);
  const [editMedicationOpen, setEditMedicationOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [addMarRecordOpen, setAddMarRecordOpen] = useState(false);
  const [addAdlRecordOpen, setAddAdlRecordOpen] = useState(false);
  const [addDailyVitalsOpen, setAddDailyVitalsOpen] = useState(false);
  const [addWeightEntryOpen, setAddWeightEntryOpen] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleEditMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    setEditMedicationOpen(true);
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
              <h3 className="font-semibold text-destructive">Error Loading Resident</h3>
              <p className="mt-1 text-sm text-destructive/90">
                {error.message === 'UNAUTHORIZED'
                  ? 'You do not have permission to view this resident.'
                  : error.message || 'Failed to load resident information'}
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleRetry} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
                <Button onClick={() => navigate({ to: '/' })} variant="outline" size="sm">
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
          <Button onClick={() => navigate({ to: '/' })} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const age = calculateAge(resident.dateOfBirth);
  const initials = `${resident.firstName[0]}${resident.lastName[0]}`;
  const activeMedications = resident.medications.filter((m) => m.status === 'active');

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: '/' })}>
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
          {/* Admin-only Edit Profile button */}
          {!adminLoading && isAdmin && (
            <Button onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
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
            <Badge variant={resident.status === 'active' ? 'default' : 'secondary'}>
              {resident.status === 'active' ? 'Active' : 'Discharged'}
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
              <p className="font-medium">{formatDate(resident.admissionDate)}</p>
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
                {resident.roomType === 'solo' ? 'Solo' : 'Shared Room'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Medicaid Number</p>
              <p className="font-medium">{resident.medicaidNumber || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Medicare Number</p>
              <p className="font-medium">{resident.medicareNumber || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Three Info Cards Side by Side */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Assigned Physicians */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4" />
              Assigned Physicians
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resident.physicians.length === 0 ? (
              <p className="text-sm text-muted-foreground">No physicians assigned</p>
            ) : (
              <div className="space-y-3">
                {resident.physicians.map((physician) => (
                  <div key={physician.id.toString()} className="space-y-1">
                    <p className="font-medium">{physician.name}</p>
                    <p className="text-sm text-muted-foreground">{physician.specialty}</p>
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

        {/* Pharmacy Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Pharmacy Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!resident.pharmacy ? (
              <p className="text-sm text-muted-foreground">No pharmacy assigned</p>
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

        {/* Responsible Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Responsible Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resident.responsiblePersons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts assigned</p>
            ) : (
              <div className="space-y-3">
                {resident.responsiblePersons.map((person) => (
                  <div key={person.id.toString()} className="space-y-1">
                    <p className="font-medium">{person.name}</p>
                    <p className="text-sm text-muted-foreground">{person.relationship}</p>
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

      {/* Insurance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Insurance Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!resident.insurance ? (
            <p className="text-sm text-muted-foreground">No insurance information available</p>
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
                <p className="font-medium">{resident.insurance.contactNumber}</p>
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
        </TabsList>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          <div className="flex justify-between print:hidden">
            <h3 className="text-lg font-semibold">Active Medications</h3>
            {/* Admin-only Add Medication button */}
            {!adminLoading && isAdmin && (
              <Button onClick={() => setAddMedicationOpen(true)}>
                <Pill className="mr-2 h-4 w-4" />
                Add Medication
              </Button>
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
                <Card key={medication.id.toString()}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{medication.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                      </div>
                      <Badge>{medication.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Administration Times:</p>
                      <p className="text-sm text-muted-foreground">
                        {medication.administrationTimes.join(', ')}
                      </p>
                    </div>
                    {medication.prescribingPhysician && (
                      <div>
                        <p className="text-sm font-medium">Prescribing Physician:</p>
                        <p className="text-sm text-muted-foreground">
                          {medication.prescribingPhysician.name}
                        </p>
                      </div>
                    )}
                    {medication.notes && (
                      <div>
                        <p className="text-sm font-medium">Notes:</p>
                        <p className="text-sm text-muted-foreground">{medication.notes}</p>
                      </div>
                    )}
                    {/* Admin-only Edit button */}
                    {!adminLoading && isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMedication(medication)}
                        className="mt-2 w-full"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Medication
                      </Button>
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
            <Button onClick={() => setAddDailyVitalsOpen(true)}>
              <Activity className="mr-2 h-4 w-4" />
              Add Vitals
            </Button>
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
              {resident.dailyVitals
                .sort((a, b) => Number(b.measurementDateTime - a.measurementDateTime))
                .map((vitals) => (
                  <Card key={vitals.id.toString()}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {formatDate(vitals.measurementDateTime)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Temperature</p>
                          <p className="font-medium">{vitals.temperature}°F</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Blood Pressure</p>
                          <p className="font-medium">
                            {vitals.bloodPressureSystolic.toString()}/
                            {vitals.bloodPressureDiastolic.toString()} mmHg
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Pulse Rate</p>
                          <p className="font-medium">{vitals.pulseRate.toString()} bpm</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Respiratory Rate</p>
                          <p className="font-medium">{vitals.respiratoryRate.toString()} /min</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Oxygen Saturation</p>
                          <p className="font-medium">{vitals.oxygenSaturation.toString()}%</p>
                        </div>
                        {vitals.bloodGlucose && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Blood Glucose</p>
                            <p className="font-medium">{vitals.bloodGlucose.toString()} mg/dL</p>
                          </div>
                        )}
                      </div>
                      {vitals.notes && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Notes:</p>
                          <p className="text-sm text-muted-foreground">{vitals.notes}</p>
                        </div>
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
            <h3 className="text-lg font-semibold">Medication Administration Records</h3>
            <Button onClick={() => setAddMarRecordOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Add MAR Record
            </Button>
          </div>
          {resident.marRecords.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No MAR records</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {resident.marRecords
                .sort((a, b) => Number(b.administrationTime - a.administrationTime))
                .map((record) => (
                  <Card key={record.id.toString()}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{record.medication.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.administrationTime)}
                          </p>
                        </div>
                        <Badge>{record.medication.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Dosage:</p>
                        <p className="text-sm text-muted-foreground">{record.medication.dosage}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Administered By:</p>
                        <p className="text-sm text-muted-foreground">{record.administeredBy}</p>
                      </div>
                      {record.notes && (
                        <div>
                          <p className="text-sm font-medium">Notes:</p>
                          <p className="text-sm text-muted-foreground">{record.notes}</p>
                        </div>
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
            <h3 className="text-lg font-semibold">Activities of Daily Living</h3>
            <Button onClick={() => setAddAdlRecordOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Add ADL Record
            </Button>
          </div>
          {resident.adlRecords.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No ADL records</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {resident.adlRecords
                .sort((a, b) => Number(b.date - a.date))
                .map((record) => (
                  <Card key={record.id.toString()}>
                    <CardHeader>
                      <CardTitle className="text-base">{record.activity}</CardTitle>
                      <p className="text-sm text-muted-foreground">{formatDate(record.date)}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Assistance Level:</p>
                        <p className="text-sm text-muted-foreground">{record.assistanceLevel}</p>
                      </div>
                      {record.staffNotes && (
                        <div>
                          <p className="text-sm font-medium">Staff Notes:</p>
                          <p className="text-sm text-muted-foreground">{record.staffNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {isAdmin && (
        <>
          <EditResidentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            resident={resident}
          />
          <AddMedicationDialog
            open={addMedicationOpen}
            onOpenChange={setAddMedicationOpen}
            resident={resident}
          />
          {selectedMedication && (
            <EditMedicationDialog
              open={editMedicationOpen}
              onOpenChange={setEditMedicationOpen}
              resident={resident}
              medication={selectedMedication}
            />
          )}
        </>
      )}
      <AddMarRecordDialog
        open={addMarRecordOpen}
        onOpenChange={setAddMarRecordOpen}
        resident={resident}
      />
      <AddAdlRecordDialog
        open={addAdlRecordOpen}
        onOpenChange={setAddAdlRecordOpen}
        resident={resident}
      />
      <AddDailyVitalsDialog
        open={addDailyVitalsOpen}
        onOpenChange={setAddDailyVitalsOpen}
        resident={resident}
      />
      <AddWeightEntryDialog
        open={addWeightEntryOpen}
        onOpenChange={setAddWeightEntryOpen}
        resident={resident}
      />
    </div>
  );
}
